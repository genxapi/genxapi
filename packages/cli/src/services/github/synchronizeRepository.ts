import { Octokit } from "octokit";

import type { SyncOptions } from "./types";
import { ensureRepository } from "./ensureRepository";
import { ensureGitInitialization } from "./git/ensureGitInitialization";
import { hasBranch } from "./githubApi/hasBranch";
import { synchronizeExistingRepository } from "./synchronizeExistingRepository";
import { pushInitialCommit } from "./pushInitialCommit";

/**
 * Synchronizes generated artifacts with GitHub.
 * - Creates the repository when allowed.
 * - For existing repos, pushes changes to a new branch and opens a PR.
 * - For repos without a default branch, pushes directly to the default branch.
 *
 * @param options - Synchronization options.
 */
export async function synchronizeRepository(options: SyncOptions): Promise<void> {
  const { repository, projectDir, logger } = options;
  const tokenEnv = repository.tokenEnv ?? "GITHUB_TOKEN";
  const token = process.env[tokenEnv];

  if (!token) {
    logger.warn(`Skipping GitHub sync: environment variable ${tokenEnv} is not set.`);
    return;
  }

  const octokit = new Octokit({ auth: token });
  const owner = repository.owner;
  const repo = repository.name;

  const repoData = await ensureRepository(octokit, repository, logger);
  await ensureGitInitialization(projectDir, repository, logger);

  const defaultBranch = repository.defaultBranch ?? repoData?.data.default_branch ?? "main";
  const repoHasBaseBranch =
    repoData && (await hasBranch(octokit, owner, repo, defaultBranch));

  if (repoHasBaseBranch) {
    await synchronizeExistingRepository({
      octokit,
      owner,
      repo,
      projectDir,
      repository,
      token,
      defaultBranch,
      logger
    });
  } else {
    await pushInitialCommit({
      projectDir,
      repository,
      token,
      defaultBranch,
      owner,
      repo,
      logger
    });
  }
}
