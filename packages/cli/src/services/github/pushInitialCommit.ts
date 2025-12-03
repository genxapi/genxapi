import type { RepositoryConfig } from "./types";
import type { Logger } from "../../utils/logger";
import { configureGitRemote } from "./git/configureGitRemote";
import { commitAll } from "./git/commitAll";
import { ensureGitUser } from "./git/ensureGitUser";
import { pushBranch } from "./git/pushBranch";
import { repositoryHasCommits } from "./git/repositoryHasCommits";
import { runGit } from "./git/runGit";

/**
 * Handles synchronization when the remote repository exists but has no default branch yet.
 * Initializes main, commits generated changes, and pushes directly.
 *
 * @param params - Sync context including projectDir, repo info, and auth token.
 */
export async function pushInitialCommit({
  projectDir,
  repository,
  token,
  defaultBranch,
  owner,
  repo,
  logger
}: {
  projectDir: string;
  repository: RepositoryConfig;
  token: string;
  defaultBranch: string;
  owner: string;
  repo: string;
  logger: Logger;
}): Promise<void> {
  await configureGitRemote(projectDir, owner, repo, logger);
  await ensureGitUser(projectDir);
  const hasExistingCommits = await repositoryHasCommits(projectDir);
  if (hasExistingCommits) {
    await runGit(["checkout", "-B", defaultBranch], projectDir);
  } else {
    await runGit(["checkout", "--orphan", defaultBranch], projectDir);
  }
  const hasChanges = await commitAll(projectDir, repository.commitMessage, logger);
  if (!hasChanges) {
    logger.info("No changes detected for initial push. Skipping GitHub synchronization.");
    return;
  }
  await pushBranch(projectDir, defaultBranch, token, owner, repo, logger);
  logger.info(`Pushed initial commit to ${owner}/${repo}@${defaultBranch}.`);
}
