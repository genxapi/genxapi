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
  const tokenSources = new Set<string>();
  if (repository.tokenEnv) {
    tokenSources.add(repository.tokenEnv);
  }
  tokenSources.add("GITHUB_TOKEN");
  tokenSources.add("GH_TOKEN");
  const tokenEntries = Array.from(tokenSources).map((name) => ({
    name,
    value: process.env[name]
  }));
  const selectedToken = tokenEntries.find(
    (entry) => typeof entry.value === "string" && entry.value.length > 0
  );
  const token = selectedToken?.value;

  if (!token) {
    const expected = tokenEntries.map((entry) => entry.name).join(" or ");
    logger.warn(`Missing ${expected} for automated GitHub HTTPS auth. Skipping GitHub sync.`);
    return;
  }

  const octokit = new Octokit({ auth: token });
  const owner = repository.owner;
  const repo = repository.name;

  try {
    logger.debug("[GitHub] 1/4 Validate existance and create repository if required")
    const repoData = await ensureRepository(octokit, repository, logger);

    logger.debug("[GitHub] 2/4 Validate git initialisation and init git if required")
    await ensureGitInitialization(projectDir, repository, logger);

    const defaultBranch = repository.defaultBranch ?? repoData?.data.default_branch ?? "main";
    logger.debug("[GitHub] 3/4 Check branch existance on remote")
    const repoHasBaseBranch =
    repoData && (await hasBranch(octokit, owner, repo, defaultBranch));

    if (repoHasBaseBranch) {
      logger.debug("[GitHub] 4/4 Sync existing repository with local generated code")
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
      logger.debug("[GitHub] 4/4 Push initial commit to remote")
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
  } catch (error) {
    if (isGithubAuthError(error)) {
      const expected = tokenEntries.map((entry) => entry.name).join(" or ");
      const tokenLabel = selectedToken?.name ?? expected;
      throw new Error(
        `GitHub authentication failed using ${tokenLabel}. ` +
          `Ensure ${expected} has repo access, or unset it to skip GitHub sync.`
      );
    }
    throw error;
  }
}

function isGithubAuthError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return false;
  }
  const status = (error as { status?: number }).status;
  return status === 401 || status === 403;
}
