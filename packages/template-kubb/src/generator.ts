import { resolve } from "pathe";
import fs from "fs-extra";
import type { MultiClientConfig, GenerateClientsOptions } from "./types.js";
import { TEMPLATE_ROOT } from "./generator/constants.js";
import { applyPackageJson } from "./generator/applyPackageJson.js";
import { applyTemplateVariables } from "./generator/applyTemplateVariables.js";
import { ensureClientWorkspaces } from "./generator/prepareWorkspaces.js";
import { handleSwaggerDocuments } from "./generator/handleSwaggerDocuments.js";
import { writeKubbConfig } from "./generator/writeKubbConfig.js";
import { writeReadme } from "./generator/writeReadme.js";
import { installDependencies, runHooks, runKubb } from "./generator/runTasks.js";
import { writeRootIndex, writeClientIndex } from "./generator/workspaceFiles.js";

export async function generateClients(
  config: MultiClientConfig,
  options: GenerateClientsOptions = {}
): Promise<void> {
  const logger = options.logger ?? console;
  const projectDir = resolve(options.configDir ?? process.cwd(), config.project.directory);
  const templateDir = config.project.template.path
    ? resolve(options.configDir ?? process.cwd(), config.project.template.path)
    : TEMPLATE_ROOT;

  logger.info(`Scaffolding project into ${projectDir}`);
  await fs.ensureDir(projectDir);
  await fs.copy(templateDir, projectDir, {
    overwrite: true,
    dereference: true
  });

  await applyPackageJson(projectDir, config);
  await applyTemplateVariables(projectDir, config);
  await ensureClientWorkspaces(projectDir, config.clients);
  const { targets: swaggerTargets, infos: swaggerInfos } = await handleSwaggerDocuments(
    projectDir,
    config,
    options,
    logger
  );
  await writeKubbConfig(projectDir, config, swaggerTargets);
  await writeReadme(projectDir, config, swaggerInfos);

  if (config.project.template.installDependencies) {
    await installDependencies(projectDir, config.project.packageManager, logger);
  }

  if (config.hooks.beforeGenerate.length > 0) {
    await runHooks(config.hooks.beforeGenerate, projectDir, logger);
  }

  if (options.runKubb ?? config.project.runGenerate) {
    await runKubb(projectDir, config.project.packageManager, logger);
  }

  for (const client of config.clients) {
    await writeClientIndex(projectDir, client);
  }
  await writeRootIndex(projectDir, config.clients);

  if (config.hooks.afterGenerate.length > 0) {
    await runHooks(config.hooks.afterGenerate, projectDir, logger);
  }
}
