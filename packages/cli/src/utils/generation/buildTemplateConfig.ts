import { CliConfig } from "src/config/loader";

type TemplateProject = Omit<CliConfig["project"], "template"> & {
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
  const template = {
    name: templateName,
    installDependencies: templateOptions.installDependencies ?? true,
    path: templateOptions.path,
    variables: templateOptions.variables ?? {}
  };

  const templateConfig: TemplateReadyConfig = {
    ...config,
    project: {
      ...config.project,
      template
    }
  };

  return templateConfig;
}
