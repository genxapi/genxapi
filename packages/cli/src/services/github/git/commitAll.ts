import type { Logger } from "../../../utils/logger";
import { getStatus } from "./getStatus";
import { runGit } from "./runGit";

/**
 * Stages all changes and commits them with the provided message.
 *
 * @param projectDir - Project directory.
 * @param message - Commit message.
 * @param logger - Logger for informational output.
 * @returns True when a commit was created, false when there were no changes.
 */
export async function commitAll(
  projectDir: string,
  message: string,
  logger: Logger
): Promise<boolean> {
  await runGit(["add", "--all"], projectDir);
  const status = await getStatus(projectDir);
  if (!status) {
    return false;
  }
  await runGit(["commit", "-m", message], projectDir);
  logger.info("Committed generated artifacts.");
  return true;
}
