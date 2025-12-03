import { runGit } from "./runGit";

/**
 * Checks whether a local branch exists.
 *
 * @param projectDir - Project directory.
 * @param branch - Branch name to verify.
 * @returns True when the branch exists locally.
 */
export async function hasLocalBranch(projectDir: string, branch: string): Promise<boolean> {
  try {
    await runGit(["rev-parse", "--verify", branch], projectDir);
    return true;
  } catch {
    return false;
  }
}
