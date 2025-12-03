import { runGit } from "./runGit";

/**
 * Retrieves the URL configured for a git remote.
 *
 * @param projectDir - Project directory.
 * @param name - Remote name (e.g. origin).
 * @returns Remote URL or null if not set.
 */
export async function getRemoteUrl(projectDir: string, name: string): Promise<string | null> {
  try {
    const result = await runGit(["remote", "get-url", name], projectDir);
    return result.trim();
  } catch {
    return null;
  }
}
