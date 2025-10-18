import ora from "ora";
import { generateClients } from "@eduardoac/api-client-template";
import type { CliConfig } from "../config/schema.js";
import type { Logger } from "../utils/logger.js";

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
  } catch (error) {
    spinner.fail("Client generation failed");
    throw error;
  }
}
