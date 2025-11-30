import { resolve } from "node:path";

import { RepositoryConfig, NpmPublishConfig } from "@genxapi/template-orval";
import { GenerateCommandOptions } from "src/commands/generate.js";
import { synchronizeRepository } from "src/services/github.js";
import { publishToNpm } from "src/services/npm.js";

export async function runPostGenerationTasks(options: GenerateCommandOptions): Promise<void> {
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
