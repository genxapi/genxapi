import { readFile } from "node:fs/promises";
import { dirname, resolve } from "pathe";
import { cosmiconfig } from "cosmiconfig";
import YAML from "yaml";
import { z } from "zod";
import type { LogLevel } from "../utils/logger.js";

const MODULE_NAME = "generate-api-client";
const DEFAULT_TEMPLATE = "@eduardoac/api-client-template";

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
    readonly template: {
      readonly installDependencies: boolean;
      readonly [key: string]: unknown;
    };
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
  const templateName = overrideTemplate ?? resolveTemplateName(rawConfig);
  const template = await loadTemplateModule(templateName);

  const cliSchema = template.schema.extend({
    logLevel: LogLevelSchema
  });

  const parsed = cliSchema.parse(rawConfig) as CliConfig;
  const configWithTemplate: CliConfig = {
    ...parsed,
    project: {
      ...parsed.project,
      template: {
        ...parsed.project.template,
        name: templateName
      }
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
    throw new Error("Unable to find generate-api-client configuration.");
  }
  return { config: result.config, dir: dirname(result.filepath) };
}

function parseConfig(content: string, filePath: string): unknown {
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
    return YAML.parse(content);
  }
  return JSON.parse(content);
}

const TEMPLATE_ALIASES: Record<string, string> = {
  orval: "@eduardoac/api-client-template",
  kubb: "@eduardoac/kubb-client-template"
};

function resolveTemplateAlias(name: string): string {
  const trimmed = name.trim();
  const normalised = trimmed.toLowerCase();
  return TEMPLATE_ALIASES[normalised] ?? trimmed;
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
  if (typeof template !== "object" || template === null) {
    return DEFAULT_TEMPLATE;
  }

  const name = (template as Record<string, unknown>).name;
  return typeof name === "string" && name.length > 0 ? resolveTemplateAlias(name) : DEFAULT_TEMPLATE;
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
