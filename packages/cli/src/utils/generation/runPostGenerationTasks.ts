import { resolve } from "node:path";

import {
  RepositoryConfig,
  NpmPublishConfig,
  GithubPublishConfig
} from "@genxapi/template-orval";
import { GenerateCommandOptions } from "src/commands/generate";
import { synchronizeRepository } from "src/services/github";
import { publishToNpm } from "src/services/npm";

/**
 * Executes post-generation actions such as repo sync and package publish.
 *
 * @param options - Generation context and config.
 */
export async function runPostGenerationTasks(options: GenerateCommandOptions): Promise<void> {
  const projectDir = resolve(options.configDir, options.config.project.directory);
  const repository = options.config.project.repository as unknown as RepositoryConfig | undefined;
  const { publish } = options.config.project;

  if (repository) {
    options.logger.info("Post-generation: synchronizing repository (fetch/push/PR).");
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
  const githubPublish = publish?.github as unknown as GithubPublishConfig | undefined;
  const resolvedGithubPublish: NpmPublishConfig | undefined = githubPublish
    ? {
        registry: githubPublish.registry ?? "https://npm.pkg.github.com",
        tokenEnv: githubPublish.tokenEnv ?? "GITHUB_TOKEN",
        access: githubPublish.access ?? "restricted",
        ...githubPublish
      }
    : undefined;

  if (npmPublish?.enabled) {
    options.logger.info("Post-generation: publishing package to npm registry.");
    await publishToNpm({
      projectDir,
      config: npmPublish,
      logger: options.logger
    });
  }

  if (resolvedGithubPublish?.enabled) {
    options.logger.info("Post-generation: publishing package to GitHub Packages.");
    await publishToNpm({
      projectDir,
      config: resolvedGithubPublish,
      logger: options.logger
    });
  }
}
