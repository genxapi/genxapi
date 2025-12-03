import type { Octokit } from "octokit";

import type { RepositoryConfig } from "./types";
import type { Logger } from "../../utils/logger";
import { buildBranchName } from "./branch/buildBranchName";
import { configureGitRemote } from "./git/configureGitRemote";
import { checkoutFromRemote } from "./git/checkoutFromRemote";
import { commitAll } from "./git/commitAll";
import { ensureGitUser } from "./git/ensureGitUser";
import { fetchBranch } from "./git/fetchBranch";
import { getStatus } from "./git/getStatus";
import { hasLocalBranch } from "./git/hasLocalBranch";
import { pushBranch } from "./git/pushBranch";
import { repositoryHasCommits } from "./git/repositoryHasCommits";
import { runGit } from "./git/runGit";
import { prepareWorkingTreeForBranchSwitch } from "./workingTree/prepareWorkingTreeForBranchSwitch";

/**
 * Syncs changes to an existing repository by creating a branch, committing, pushing, and opening a PR.
 *
 * @param params - Sync inputs including octokit, repository metadata, and git context.
 */
export async function synchronizeExistingRepository({
  octokit,
  owner,
  repo,
  projectDir,
  repository,
  token,
  defaultBranch,
  logger
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  projectDir: string;
  repository: RepositoryConfig;
  token: string;
  defaultBranch: string;
  logger: Logger;
}): Promise<void> {
  await configureGitRemote(projectDir, owner, repo, logger);
  await ensureGitUser(projectDir);

  await fetchBranch(projectDir, token, owner, repo, defaultBranch);

  const hasAnyCommits = await repositoryHasCommits(projectDir);
  const workingTreeStatus = await getStatus(projectDir);
  let restoreWorkingTree = await prepareWorkingTreeForBranchSwitch(
    projectDir,
    hasAnyCommits,
    workingTreeStatus,
    logger
  );

  try {
    const hasLocalDefaultBranch = await hasLocalBranch(projectDir, defaultBranch);
    if (hasLocalDefaultBranch) {
      await runGit(["checkout", defaultBranch], projectDir);
    } else {
      await checkoutFromRemote(projectDir, defaultBranch);
    }

    await runGit(["reset", "--hard", `origin/${defaultBranch}`], projectDir);

    const branchName = await buildBranchName(repository.pullRequest, projectDir);
    await runGit(["checkout", "-B", branchName, defaultBranch], projectDir);

    if (restoreWorkingTree) {
      await restoreWorkingTree();
      restoreWorkingTree = null;
    }

    const hasChanges = await commitAll(projectDir, repository.commitMessage, logger);
    if (!hasChanges) {
      logger.info("No changes detected. Skipping GitHub pull request creation.");
      return;
    }

    await pushBranch(projectDir, branchName, token, owner, repo, logger);

    if (!repository.pullRequest.enabled) {
      logger.info("Pull request creation disabled. Changes pushed to remote branch.");
      return;
    }

    const existing = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "open",
      head: `${owner}:${branchName}`
    });

    if (existing.data.length > 0) {
      logger.info(
        `Pull request for branch ${branchName} already exists (#${existing.data[0].number}).`
      );
      return;
    }

    const pr = await octokit.rest.pulls.create({
      owner,
      repo,
      base: defaultBranch,
      head: branchName,
      title: repository.pullRequest.title,
      body: repository.pullRequest.body
    });

    logger.info(`Opened pull request #${pr.data.number} for ${owner}/${repo}.`);
  } finally {
    if (restoreWorkingTree) {
      await restoreWorkingTree().catch(() => {});
    }
  }
}
