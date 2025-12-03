import type { Logger } from "../../../utils/logger";
import { runGit } from "./runGit";

/**
 * Ensures the git remote named "origin" points to the expected GitHub URL.
 *
 * @param projectDir - Project directory.
 * @param owner - GitHub owner or org.
 * @param repo - Repository name.
 * @param logger - Logger for debug output.
 */
export async function configureGitRemote(
  projectDir: string,
  owner: string,
  repo: string,
  logger: Logger
): Promise<void> {
  const remoteUrl = `https://github.com/${owner}/${repo}.git`;
  try {
    await runGit(["remote", "set-url", "origin", remoteUrl], projectDir);
  } catch {
    await runGit(["remote", "add", "origin", remoteUrl], projectDir);
  }
  logger.debug?.("Configured git remote.");
}
