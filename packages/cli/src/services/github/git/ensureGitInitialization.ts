import { existsSync } from "node:fs";
import { join } from "node:path";

import type { RepositoryConfig } from "../types";
import type { Logger } from "../../../utils/logger";
import { runGit } from "./runGit";

/**
 * Ensures the project directory has an initialized git repository.
 *
 * @param projectDir - Target project folder.
 * @param repository - Repository configuration.
 * @param logger - Logger for informational output.
 */
export async function ensureGitInitialization(
  projectDir: string,
  repository: RepositoryConfig,
  logger: Logger
): Promise<void> {
  if (!existsSync(join(projectDir, ".git"))) {
    logger.info("Initializing git repository.");
    await runGit(["init"], projectDir);
  }
}
