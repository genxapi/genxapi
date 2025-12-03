import ora from "ora";
import type { CliConfig, TemplateModule } from "../config/loader";
import { applyTemplateOverrides } from "../utils/overrides";
import type { TemplateOverrides } from "../types";
import type { Logger } from "../utils/logger";
import { inferTemplateKind } from "src/utils/generation/inferTemplateKind";
import { buildTemplateConfig } from "src/utils/generation/buildTemplateConfig";
import { runPostGenerationTasks } from "src/utils/generation/runPostGenerationTasks";

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
    options.logger.info(`Generation step 1/4: applying template overrides for ${templateKind}.`);
    const config = applyTemplateOverrides(options.config, templateKind, options.overrides);
    options.logger.info("Generation step 2/4: building template configuration.");
    const templateConfig = buildTemplateConfig(config, options.template.name);

    options.logger.info(
      `Generation step 3/4: running ${options.template.name} client generator (runGenerate=${templateConfig.project.runGenerate}).`
    );
    await options.template.generateClients(templateConfig, {
      configDir: options.configDir,
      logger: options.logger,
      runOrval: templateConfig.project.runGenerate,
      runKubb: templateConfig.project.runGenerate
    });

    spinner.succeed("Clients generated successfully");

    options.logger.info("Generation step 4/4: executing post-generation tasks (repo sync, publish).");
    await runPostGenerationTasks({
      ...options,
      config
    });
  } catch (error) {
    spinner.fail("Client generation failed");
    throw error;
  }
}
