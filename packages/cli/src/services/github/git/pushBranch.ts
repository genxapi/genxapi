import type { Logger } from "../../../utils/logger";
import { buildGitAuthContext } from "./buildGitAuth";
import { runGit } from "./runGit";

/**
 * Pushes the specified branch to origin using a token-authenticated header.
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
  const auth = buildGitAuthContext(token);
  await runGit(
    ["-c", auth.extraHeader, "push", "--set-upstream", remoteName, branch],
    projectDir,
    { redactValues: auth.redactValues }
  );

  logger.info(`Pushed branch ${branch} to ${owner}/${repo}.`);
}
