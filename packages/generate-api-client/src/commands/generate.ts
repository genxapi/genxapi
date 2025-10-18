import { resolve } from "node:path";
import ora from "ora";
import { generateClients } from "@eduardoac/api-client-template";
import type { CliConfig } from "../config/schema.js";
import type { Logger } from "../utils/logger.js";
import { synchronizeRepository } from "../services/github.js";
import { publishToNpm } from "../services/npm.js";

export interface GenerateCommandOptions {
  readonly config: CliConfig;
  readonly configDir: string;
  readonly logger: Logger;
  readonly dryRun?: boolean;
}

export async function runGenerateCommand(options: GenerateCommandOptions): Promise<void> {
  const spinner = ora("Preparing client generation").start();
  try {
    if (options.dryRun) {
      spinner.succeed("Configuration validated. Dry run complete.");
      return;
    }

    await generateClients(options.config, {
      configDir: options.configDir,
      logger: options.logger,
      runOrval: options.config.project.runGenerate
    });

    spinner.succeed("Clients generated successfully");

    await runPostGenerationTasks(options);
  } catch (error) {
    spinner.fail("Client generation failed");
    throw error;
  }
}

async function runPostGenerationTasks(options: GenerateCommandOptions): Promise<void> {
  const projectDir = resolve(options.configDir, options.config.project.directory);
  const { repository, publish } = options.config.project;

  if (repository) {
    await synchronizeRepository({
      projectDir,
      repository,
      logger: options.logger
    });
  }

  const npmPublish = publish?.npm;
  if (npmPublish?.enabled) {
    await publishToNpm({
      projectDir,
      config: npmPublish,
      logger: options.logger
    });
  }
}
