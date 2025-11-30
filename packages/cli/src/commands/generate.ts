import ora from "ora";
import type { CliConfig, TemplateModule } from "../config/loader/index.js";
import { applyTemplateOverrides } from "../utils/overrides/index.js";
import type { TemplateOverrides } from "../types";
import type { Logger } from "../utils/logger.js";
import { inferTemplateKind } from "src/utils/generation/inferTemplateKind.js";
import { buildTemplateConfig } from "src/utils/generation/buildTemplateConfig.js";
import { runPostGenerationTasks } from "src/utils/generation/runPostGenerationTasks.js";

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
