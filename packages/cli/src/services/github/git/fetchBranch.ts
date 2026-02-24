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
  const authHeader = `http.extraheader=Authorization: Bearer ${token}`;
  await runGit(["-c", authHeader, "fetch", remoteName, branch], projectDir, {
    redactValues: [token]
  });
}
