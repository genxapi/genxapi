import type { Octokit } from "octokit";

import { isNotFound } from "./isNotFound";

/**
 * Checks whether a branch exists in the remote repository.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param owner - Repository owner.
 * @param repo - Repository name.
 * @param branch - Branch to check.
 * @returns True when the branch exists.
 */
export async function hasBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> {
  try {
    await octokit.rest.repos.getBranch({ owner, repo, branch });
    return true;
  } catch (error) {
    if (isNotFound(error)) {
      return false;
    }
    throw error;
  }
}
