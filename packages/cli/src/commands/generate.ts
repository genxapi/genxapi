import ora from "ora";
import { resolve } from "node:path";
import type { CliConfig, TemplateModule } from "../config/loader";
import { applyTemplateOverrides } from "../utils/overrides";
import type { TemplateOverrides } from "../types";
import type { Logger } from "../utils/logger";
import { inferTemplateKind } from "src/utils/generation/inferTemplateKind";
import { buildTemplateConfig } from "src/utils/generation/buildTemplateConfig";
import { runPostGenerationTasks } from "src/utils/generation/runPostGenerationTasks";
import { resolveContractSources, writeGenerationManifest } from "src/utils/contracts";

export interface GenerateCommandOptions {
  readonly config: CliConfig;
  readonly configDir: string;
  readonly logger: Logger;
  readonly dryRun?: boolean;
  readonly template: TemplateModule;
  readonly overrides?: TemplateOverrides;
  readonly toolVersion?: string;
}

export async function runGenerateCommand(options: GenerateCommandOptions): Promise<void> {
  const spinner = ora("Preparing client generation").start();
  try {
    if (options.dryRun) {
      spinner.succeed("Configuration validated. Dry run complete.");
      return;
    }

    const builtinTemplateKind = inferTemplateKind(options.template.name);
    const templateKind = builtinTemplateKind ?? "custom";
    options.logger.info(`Generation step 1/7: applying template overrides for ${templateKind}.`);
    const config = applyTemplateOverrides(options.config, builtinTemplateKind, options.overrides);
    options.logger.info("Generation step 2/7: building template configuration.");
    const templateConfig = buildTemplateConfig(config, options.template.name);
    await options.template.validateConfig?.(templateConfig);
    options.logger.info("Generation step 3/7: planning template capabilities and dependencies.");
    const templatePlan =
      (await options.template.planGeneration?.(templateConfig, {
        templateName: options.template.name
      })) ?? {
        selectedCapabilities: [],
        dependencies: []
      };
    const project = templateConfig.project as {
      readonly name: string;
      readonly directory: string;
      readonly runGenerate: boolean;
    };
    const clients = templateConfig.clients as Parameters<typeof resolveContractSources>[0]["clients"];
    const manifestClients =
      templateConfig.clients as Parameters<typeof writeGenerationManifest>[0]["clients"];
    const projectDir = resolve(options.configDir, project.directory);
    const generatedAt = new Date().toISOString();

    options.logger.info("Generation step 4/7: resolving contract sources and reproducibility metadata.");
    const resolvedContracts = await resolveContractSources({
      configDir: options.configDir,
      projectDir,
      clients,
      logger: options.logger
    });

    options.logger.info(
      `Generation step 5/7: running ${options.template.name} client generator (runGenerate=${templateConfig.project.runGenerate}).`
    );
    await options.template.generateClients(templateConfig, {
      configDir: options.configDir,
      generatedAt,
      logger: options.logger,
      resolvedContracts,
      runOrval: project.runGenerate,
      runKubb: project.runGenerate,
      templatePlan,
      toolVersion: options.toolVersion
    });

    options.logger.info("Generation step 6/7: writing generation manifest.");
    await writeGenerationManifest({
      clients: manifestClients,
      generatedAt,
      projectDir,
      projectDirectory: project.directory,
      projectName: project.name,
      resolvedContracts,
      templateKind,
      templateName: options.template.name,
      toolVersion: options.toolVersion
    });

    spinner.succeed("Clients generated successfully");

    options.logger.info("Generation step 7/7: executing post-generation tasks (repo sync, publish).");
    await runPostGenerationTasks({
      ...options,
      config
    });
  } catch (error) {
    spinner.fail("Client generation failed");
    throw error;
  }
}
