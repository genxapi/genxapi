import { CliConfig } from "src/config/loader";

type TemplateProject = {
  name: string;
  directory: string;
  packageManager: "npm" | "pnpm" | "yarn" | "bun";
  runGenerate: boolean;
  repository?: Record<string, unknown>;
  publish?: {
    readonly npm?: Record<string, unknown>;
    readonly github?: Record<string, unknown>;
    readonly [key: string]: unknown;
  };
  [key: string]: unknown;
  template: {
    name: string;
    installDependencies: boolean;
    path?: string;
    variables: Record<string, string>;
  };
};

type TemplateReadyConfig = Omit<CliConfig, "project"> & {
  project: TemplateProject;
};

/**
 * Rehydrates a CLI config with a template object expected by generators.
 *
 * @param config - Parsed CLI config.
 * @param templateName - Resolved template package name.
 * @returns Config with template details populated for generators.
 */
export function buildTemplateConfig(config: CliConfig, templateName: string): TemplateReadyConfig {
  const templateOptions = config.project.templateOptions ?? {};
  const baseTemplateConfig =
    typeof config.project.templateConfig === "object" && config.project.templateConfig !== null
      ? config.project.templateConfig
      : {};
  const template = {
    ...baseTemplateConfig,
    name: templateName,
    installDependencies:
      templateOptions.installDependencies ??
      (typeof baseTemplateConfig.installDependencies === "boolean"
        ? baseTemplateConfig.installDependencies
        : true),
    path:
      templateOptions.path ??
      (typeof baseTemplateConfig.path === "string" ? baseTemplateConfig.path : undefined),
    variables:
      templateOptions.variables ??
      (baseTemplateConfig.variables as Record<string, string> | undefined) ??
      {}
  };

  const runtimeConfig: TemplateReadyConfig = {
    ...config,
    project: {
      ...config.project,
      template
    }
  };

  return runtimeConfig;
}
