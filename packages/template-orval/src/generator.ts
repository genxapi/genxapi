import { resolve } from "pathe";
import fs from "fs-extra";
import type { MultiClientConfig, GenerateClientsOptions } from "./types.js";
import { TEMPLATE_ROOT } from "./generator/constants.js";
import { applyPackageJson } from "./generator/applyPackageJson.js";
import { applyTemplateVariables } from "./generator/applyTemplateVariables.js";
import { ensureClientWorkspaces, writeRootIndex } from "./generator/workspaceFiles.js";
import { handleSwaggerDocuments } from "./generator/handleSwaggerDocuments.js";
import { writeOrvalConfig } from "./generator/writeOrvalConfig.js";
import { generateReadme } from "./generator/writeReadme.js";
import { installDependencies, runHooks, runOrval } from "./generator/runTasks.js";

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
  await writeRootIndex(projectDir, config.clients);
  const { targets: swaggerTargets, infos: swaggerInfos } = await handleSwaggerDocuments(
    projectDir,
    config,
    options,
    logger
  );
  await writeOrvalConfig(projectDir, config, swaggerTargets);
  await generateReadme(projectDir, config, swaggerInfos);

  if (config.project.template.installDependencies) {
    await installDependencies(projectDir, config.project.packageManager, logger);
  }

  if (config.hooks.beforeGenerate.length > 0) {
    await runHooks(config.hooks.beforeGenerate, projectDir, logger);
  }

  if (options.runOrval ?? config.project.runGenerate) {
    await runOrval(projectDir, config.project.packageManager, logger);
  }

  if (config.hooks.afterGenerate.length > 0) {
    await runHooks(config.hooks.afterGenerate, projectDir, logger);
  }
}
