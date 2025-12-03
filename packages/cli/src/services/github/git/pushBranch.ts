import type { Logger } from "../../../utils/logger";
import { getRemoteUrl } from "./remoteUrl";
import { runGit } from "./runGit";

/**
 * Pushes the specified branch to origin using a token-authenticated URL.
 *
 * @param projectDir - Project directory.
 * @param branch - Branch to push.
 * @param token - GitHub token.
 * @param owner - Repository owner.
 * @param repo - Repository name.
 * @param logger - Logger for info output.
 */
export async function pushBranch(
  projectDir: string,
  branch: string,
  token: string,
  owner: string,
  repo: string,
  logger: Logger
): Promise<void> {
  const remoteName = "origin";
  const cleanUrl = await getRemoteUrl(projectDir, remoteName);
  const authUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

  try {
    await runGit(["remote", "set-url", remoteName, authUrl], projectDir);
    await runGit(["push", "--set-upstream", remoteName, branch], projectDir);
  } finally {
    if (cleanUrl) {
      await runGit(["remote", "set-url", remoteName, cleanUrl], projectDir, true);
    }
  }

  logger.info(`Pushed branch ${branch} to ${owner}/${repo}.`);
}
