import { runGit } from "./runGit";

/**
 * Creates or resets a local branch to track the specified remote branch.
 *
 * @param projectDir - Project directory.
 * @param branch - Branch name to check out from origin.
 */
export async function checkoutFromRemote(projectDir: string, branch: string): Promise<void> {
  await runGit(["checkout", "-B", branch, `origin/${branch}`], projectDir);
}
