import { buildGitAuthContext } from "./buildGitAuth";
import { runGit } from "./runGit";

/**
 * Fetches a specific branch from origin using a token-authenticated header.
 *
 * @param projectDir - Project directory.
 * @param token - GitHub token.
 * @param branch - Branch to fetch.
 */
export async function fetchBranch(
  projectDir: string,
  token: string,
  branch: string
): Promise<void> {
  const remoteName = "origin";
  const auth = buildGitAuthContext(token);
  await runGit(["-c", auth.extraHeader, "fetch", remoteName, branch], projectDir, {
    redactValues: auth.redactValues
  });
}
