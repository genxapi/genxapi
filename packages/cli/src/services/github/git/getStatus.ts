import { runGit } from "./runGit";

/**
 * Returns the porcelain git status for the working tree.
 *
 * @param projectDir - Project directory.
 * @returns Raw porcelain status text (trimmed) or an empty string when clean.
 */
export async function getStatus(projectDir: string): Promise<string> {
  const result = await runGit(["status", "--porcelain"], projectDir);
  return result.trim();
}
