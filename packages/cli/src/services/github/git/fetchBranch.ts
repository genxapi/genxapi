import { runGit } from "./runGit";
import { getRemoteUrl } from "./remoteUrl";

/**
 * Fetches a specific branch from origin using a token-authenticated URL.
 *
 * @param projectDir - Project directory.
 * @param token - GitHub token.
 * @param owner - Repository owner.
 * @param repo - Repository name.
 * @param branch - Branch to fetch.
 */
export async function fetchBranch(
  projectDir: string,
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<void> {
  const remoteName = "origin";
  const authUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
  const cleanUrl = await getRemoteUrl(projectDir, remoteName);
  try {
    if (cleanUrl !== authUrl) {
      await runGit(["remote", "set-url", remoteName, authUrl], projectDir);
    }
    await runGit(["fetch", remoteName, branch], projectDir);
  } finally {
    if (cleanUrl && cleanUrl !== authUrl) {
      await runGit(["remote", "set-url", remoteName, cleanUrl], projectDir, true);
    }
  }
}
