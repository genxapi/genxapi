import { z } from "zod";
import { TEMPLATE_PACKAGE_MAP, resolveTemplatePackage } from "../../utils/templatePackages";
import { generateTemplateConfig } from "../generateTemplateConfig";
import { inferTemplateFromConfig, resolveTemplateAlias } from "./utils/templateResolution";
import { readConfigAtPath, searchConfig } from "./utils/readConfig";
import { extractTemplateOptions } from "./utils/templateOptions";
import { loadTemplateModule, type TemplateModule } from "./templateModule";
import { ClientApiTemplates, TemplateOptions, UnifiedGeneratorConfigSchema } from "../../types";

import type { LogLevel } from "../../utils/logger";

const LogLevelSchema = z.enum(["silent", "error", "warn", "info", "debug"]).default("info");

export interface LoadCliConfigOptions {
  readonly cwd?: string;
  readonly file?: string;
  readonly template?: string;
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
      readonly github?: Record<string, unknown>;
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

export type { TemplateModule };

export async function loadCliConfig(options: LoadCliConfigOptions = {}): Promise<LoadCliConfigResult> {
  const cwd = options.cwd ?? process.cwd();
  const rawResult = options.file
    ? await readConfigAtPath(options.file, cwd)
    : await searchConfig(cwd);

  const rawConfig = rawResult.config;
  const overrideTemplate = options.template ? resolveTemplateAlias(options.template) : undefined;
  const unifiedParsed = UnifiedGeneratorConfigSchema.safeParse(rawConfig);

  let templateName: string;
  let payload: unknown;

  if (unifiedParsed.success) {
    templateName = resolveTemplatePackage(overrideTemplate ?? unifiedParsed.data.project.template);
    const transformed = generateTemplateConfig(unifiedParsed.data, templateName);
    payload = {
      ...transformed.config,
      logLevel: unifiedParsed.data.logLevel
    };
  } else {
    templateName = overrideTemplate ?? inferTemplateFromConfig(rawConfig);
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
