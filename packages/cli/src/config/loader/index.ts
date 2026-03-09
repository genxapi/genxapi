import { z } from "zod";
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
    readonly templateConfig?: Record<string, unknown>;
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

  let payload: unknown;

  const templateSelector = unifiedParsed.success
    ? overrideTemplate ?? unifiedParsed.data.project.template
    : overrideTemplate ?? inferTemplateFromConfig(rawConfig);
  const template = await loadTemplateModule(templateSelector, {
    configDir: rawResult.dir
  });

  if (unifiedParsed.success) {
    if (!template.transformUnifiedConfig) {
      throw new Error(
        `Template "${template.name}" does not expose unified config transformation. Use a native template config or a template that exports genxTemplate.transformUnifiedConfig.`
      );
    }

    const transformed = await template.transformUnifiedConfig(unifiedParsed.data, {
      templateName: template.name
    });
    payload = {
      ...(transformed as Record<string, unknown>),
      logLevel: unifiedParsed.data.logLevel
    };
  } else {
    payload = rawConfig;
  }

  const cliSchema = template.schema.extend({
    logLevel: LogLevelSchema
  });

  const parsed = cliSchema.parse(payload) as CliConfig;
  await template.validateConfig?.(parsed as unknown);
  const templateOptions = extractTemplateOptions(parsed.project.template);
  const templateConfig =
    typeof parsed.project.template === "object" && parsed.project.template !== null
      ? (parsed.project.template as Record<string, unknown>)
      : undefined;
  const configWithTemplate: CliConfig = {
    ...parsed,
    project: {
      ...parsed.project,
      template: template.name,
      templateOptions,
      templateConfig
    }
  };

  return {
    config: configWithTemplate,
    configDir: rawResult.dir,
    template
  };
}
