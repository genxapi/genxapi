import { resolve } from "node:path";
import ora from "ora";
import type { CliConfig, TemplateModule } from "../config/loader.js";
import {
  TEMPLATE_PACKAGE_MAP,
  applyTemplateOverrides,
  type TemplateOverrides
} from "../config/unified.js";
import { ClientApiTemplates } from "../types/types.js";
import type { Logger } from "../utils/logger.js";
import {
  synchronizeRepository,
  type RepositoryConfig
} from "../services/github.js";
import { publishToNpm, type NpmPublishConfig } from "../services/npm.js";

export interface GenerateCommandOptions {
  readonly config: CliConfig;
  readonly configDir: string;
  readonly logger: Logger;
  readonly dryRun?: boolean;
  readonly template: TemplateModule;
  readonly overrides?: TemplateOverrides;
}

export async function runGenerateCommand(options: GenerateCommandOptions): Promise<void> {
  const spinner = ora("Preparing client generation").start();
  try {
    if (options.dryRun) {
      spinner.succeed("Configuration validated. Dry run complete.");
      return;
    }

    const templateKind = inferTemplateKind(options.template.name);
    const config = applyTemplateOverrides(options.config, templateKind, options.overrides);
    const templateConfig = buildTemplateConfig(config, options.template.name);

    await options.template.generateClients(templateConfig, {
      configDir: options.configDir,
      logger: options.logger,
      runOrval: templateConfig.project.runGenerate,
      runKubb: templateConfig.project.runGenerate
    });

    spinner.succeed("Clients generated successfully");

    await runPostGenerationTasks({
      ...options,
      config
    });
  } catch (error) {
    spinner.fail("Client generation failed");
    throw error;
  }
}

async function runPostGenerationTasks(options: GenerateCommandOptions): Promise<void> {
  const projectDir = resolve(options.configDir, options.config.project.directory);
  const repository = options.config.project.repository as unknown as RepositoryConfig | undefined;
  const { publish } = options.config.project;

  if (repository) {
    const normalisedRepository: RepositoryConfig = {
      ...repository,
      owner: repository.owner.replace(/^@/, "")
    };
    await synchronizeRepository({
      projectDir,
      repository: normalisedRepository,
      logger: options.logger
    });
  }

  const npmPublish = publish?.npm as unknown as NpmPublishConfig | undefined;
  if (npmPublish?.enabled) {
    await publishToNpm({
      projectDir,
      config: npmPublish,
      logger: options.logger
    });
  }
}

function inferTemplateKind(templateName: string): ClientApiTemplates | undefined {
  if (templateName === TEMPLATE_PACKAGE_MAP.orval) {
    return ClientApiTemplates.Orval;
  }
  if (templateName === TEMPLATE_PACKAGE_MAP.kubb) {
    return ClientApiTemplates.Kubb;
  }
  return undefined;
}

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

function buildTemplateConfig(config: CliConfig, templateName: string): TemplateReadyConfig {
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
