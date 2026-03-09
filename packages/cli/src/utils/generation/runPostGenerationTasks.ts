import { resolve } from "node:path";
import type { RepositoryConfig } from "src/services/github/types";
import type { NpmPublishConfig } from "src/services/npm";
import { GenerateCommandOptions } from "src/commands/generate";
import { synchronizeRepository } from "src/services/github";
import { buildPackage, publishToNpm } from "src/services/npm";
type GithubPublishConfig = NpmPublishConfig;

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
        ...githubPublish,
        registry: githubPublish.registry ?? "https://npm.pkg.github.com",
        tokenEnv: githubPublish.tokenEnv ?? "GITHUB_TOKEN",
        access: githubPublish.access ?? "restricted"
      }
    : undefined;
  const shouldPublish = Boolean(npmPublish?.enabled || resolvedGithubPublish?.enabled);

  if (shouldPublish) {
    options.logger.info("Post-generation: building generated package before registry publish.");
    await buildPackage({
      projectDir,
      packageManager: options.config.project.packageManager,
      logger: options.logger
    });
  }

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
