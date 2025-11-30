import { readFile } from "node:fs/promises";
import { dirname, resolve } from "pathe";
import { cosmiconfig } from "cosmiconfig";
import YAML from "yaml";
import { z } from "zod";
import { TEMPLATE_PACKAGE_MAP, resolveTemplatePackage } from "./templatePackages.js";
import { transformUnifiedConfig } from "./transformUnifiedConfig.js";
import { ClientApiTemplates, TemplateOptions, UnifiedGeneratorConfigSchema } from "../types/index.js";

import type { LogLevel } from "../utils/logger.js";

const MODULE_NAME = "genxapi";
const DEFAULT_TEMPLATE = TEMPLATE_PACKAGE_MAP.orval;

const LogLevelSchema = z.enum(["silent", "error", "warn", "info", "debug"]).default("info");

export interface LoadCliConfigOptions {
  readonly cwd?: string;
  readonly file?: string;
  readonly template?: string;
}

export interface TemplateModule {
  readonly name: string;
  readonly schema: z.ZodObject<any>;
  readonly generateClients: (config: unknown, options: Record<string, unknown>) => Promise<void>;
}

export interface CliConfig {
  readonly logLevel: LogLevel;
  readonly project: {
    readonly name: string;
    readonly directory: string;
    readonly packageManager: "npm" | "pnpm" | "yarn" | "bun";
    readonly runGenerate: boolean;
    readonly template: ClientApiTemplates | string;
    readonly templateOptions?: TemplateOptions;
    readonly repository?: Record<string, unknown>;
    readonly publish?: {
      readonly npm?: Record<string, unknown>;
      readonly [key: string]: unknown;
    };
    readonly [key: string]: unknown;
  };
  readonly clients: unknown[];
  readonly hooks: {
    readonly beforeGenerate: string[];
    readonly afterGenerate: string[];
    readonly [key: string]: unknown;
  };
  readonly [key: string]: unknown;
}

export interface LoadCliConfigResult {
  readonly config: CliConfig;
  readonly configDir: string;
  readonly template: TemplateModule;
}

export async function loadCliConfig(options: LoadCliConfigOptions = {}): Promise<LoadCliConfigResult> {
  const cwd = options.cwd ?? process.cwd();
  const rawResult = options.file
    ? await loadFromExplicitPath(options.file, cwd)
    : await searchConfig(cwd);

  const rawConfig = rawResult.config;
  const overrideTemplate = options.template ? resolveTemplateAlias(options.template) : undefined;
  const unifiedParsed = UnifiedGeneratorConfigSchema.safeParse(rawConfig);

  let templateName: string;
  let payload: unknown;

  if (unifiedParsed.success) {
    templateName = resolveTemplatePackage(overrideTemplate ?? unifiedParsed.data.project.template);
    const transformed = transformUnifiedConfig(unifiedParsed.data, templateName);
    payload = {
      ...transformed.config,
      logLevel: unifiedParsed.data.logLevel
    };
  } else {
    templateName = overrideTemplate ?? resolveTemplateName(rawConfig);
    payload = rawConfig;
  }

  const template = await loadTemplateModule(templateName);

  const cliSchema = template.schema.extend({
    logLevel: LogLevelSchema
  });

  const parsed = cliSchema.parse(payload) as CliConfig;
  const templateOptions = extractTemplateOptions(parsed.project.template);
  const configWithTemplate: CliConfig = {
    ...parsed,
    project: {
      ...parsed.project,
      template: templateName,
      templateOptions
    }
  };

  return {
    config: configWithTemplate,
    configDir: rawResult.dir,
    template
  };
}

async function loadFromExplicitPath(path: string, cwd: string): Promise<{ config: unknown; dir: string }> {
  const absolutePath = resolve(cwd, path);
  const content = await readFile(absolutePath, "utf8");
  const parsed = parseConfig(content, absolutePath);
  return { config: parsed, dir: dirname(absolutePath) };
}

async function searchConfig(cwd: string): Promise<{ config: unknown; dir: string }> {
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      `${MODULE_NAME}rc`,
      `${MODULE_NAME}rc.json`,
      `${MODULE_NAME}rc.yaml`,
      `${MODULE_NAME}rc.yml`,
      `${MODULE_NAME}.config.json`,
      `${MODULE_NAME}.config.yaml`,
      `${MODULE_NAME}.config.yml`
    ],
    loaders: {
      ".json": (filePath, content) => parseConfig(content, filePath),
      ".yaml": (filePath, content) => parseConfig(content, filePath),
      ".yml": (filePath, content) => parseConfig(content, filePath),
      noExt: (filePath, content) => parseConfig(content, filePath)
    }
  });

  const result = await explorer.search(cwd);
  if (!result || result.isEmpty) {
    throw new Error("Unable to find genxapi configuration.");
  }
  return { config: result.config, dir: dirname(result.filepath) };
}

function parseConfig(content: string, filePath: string): unknown {
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
    return YAML.parse(content);
  }
  return JSON.parse(content);
}

function resolveTemplateAlias(name: string): string {
  return resolveTemplatePackage(name);
}

function resolveTemplateName(rawConfig: unknown): string {
  if (typeof rawConfig !== "object" || rawConfig === null) {
    return DEFAULT_TEMPLATE;
  }

  const project = (rawConfig as Record<string, unknown>).project;
  if (typeof project !== "object" || project === null) {
    return DEFAULT_TEMPLATE;
  }

  const template = (project as Record<string, unknown>).template;
  if (typeof template === "string") {
    return resolveTemplateAlias(template);
  }

  return DEFAULT_TEMPLATE;
}

function extractTemplateOptions(template: unknown): TemplateOptions {
  if (typeof template !== "object" || template === null) {
    return {};
  }

  const tpl = template as Record<string, unknown>;
  const variables = tpl.variables;
  return {
    path: typeof tpl.path === "string" ? tpl.path : undefined,
    installDependencies: typeof tpl.installDependencies === "boolean" ? tpl.installDependencies : undefined,
    variables:
      variables && typeof variables === "object" && !Array.isArray(variables)
        ? (variables as Record<string, string>)
        : undefined
  };
}

async function loadTemplateModule(name: string): Promise<TemplateModule> {
  try {
    const mod = await import(name);
    const schema = mod.MultiClientConfigSchema;
    const generateClients = mod.generateClients;
    if (!schema || typeof schema.extend !== "function") {
      throw new Error(`Template "${name}" does not export MultiClientConfigSchema.`);
    }
    if (typeof generateClients !== "function") {
      throw new Error(`Template "${name}" does not export generateClients.`);
    }
    return {
      name,
      schema,
      generateClients
    };
  } catch (error) {
    throw new Error(
      `Failed to load template "${name}". Ensure it is installed and exports MultiClientConfigSchema + generateClients. Reason: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
