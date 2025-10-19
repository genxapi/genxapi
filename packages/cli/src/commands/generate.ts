import { resolve } from "node:path";
import ora from "ora";
import type { CliConfig, TemplateModule } from "../config/loader.js";
import {
  TEMPLATE_PACKAGE_MAP,
  applyTemplateOverrides,
  type TemplateOverrides
} from "../config/unified.js";
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

    const config = structuredClone(options.config) as CliConfig;
    const templateKind = inferTemplateKind(options.template.name);
    if (templateKind) {
      applyTemplateOverrides(config as any, templateKind, options.overrides);
    }

    await options.template.generateClients(config, {
      configDir: options.configDir,
      logger: options.logger,
      runOrval: config.project.runGenerate,
      runKubb: config.project.runGenerate
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

function inferTemplateKind(templateName: string): "orval" | "kubb" | undefined {
  if (templateName === TEMPLATE_PACKAGE_MAP.orval) {
    return "orval";
  }
  if (templateName === TEMPLATE_PACKAGE_MAP.kubb) {
    return "kubb";
  }
  return undefined;
}
