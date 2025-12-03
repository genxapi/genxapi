import type { Octokit } from "octokit";

import type { RepositoryConfig } from "./types";
import type { Logger } from "../../utils/logger";
import { isNotFound } from "./githubApi/isNotFound";

/**
 * Ensures the GitHub repository exists, creating it when allowed.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param repository - Repository configuration.
 * @param logger - Logger for progress output.
 * @returns Repository metadata when it exists or is created.
 * @throws Error when the repository is missing and creation is disabled.
 */
export async function ensureRepository(
  octokit: Octokit,
  repository: RepositoryConfig,
  logger: Logger
) {
  const { owner, name, create } = repository;
  try {
    return await octokit.rest.repos.get({ owner, repo: name });
  } catch (error) {
    if (isNotFound(error)) {
      if (!create) {
        logger.warn(`Repository ${owner}/${name} does not exist and creation is disabled.`);
        throw new Error(`Repository ${owner}/${name} not found.`);
      }
      const authenticated = await octokit.rest.users.getAuthenticated();
      const authenticatedLogin = authenticated.data.login;
      if (authenticatedLogin?.toLowerCase() === owner.toLowerCase()) {
        logger.info(`Creating GitHub repository ${owner}/${name}`);
        return await octokit.rest.repos.createForAuthenticatedUser({
          name,
          private: false
        });
      }
      logger.info(`Creating GitHub repository ${owner}/${name} under organisation ${owner}`);
      return await octokit.rest.repos.createInOrg({
        org: owner,
        name
      });
    }
    throw error;
  }
}
