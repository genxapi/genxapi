import { runGit } from "./runGit";

/**
 * Checks whether the repository already has a commit on HEAD.
 *
 * @param projectDir - Project directory.
 * @returns True when HEAD resolves successfully.
 */
export async function repositoryHasCommits(projectDir: string): Promise<boolean> {
  const result = await runGit(["rev-parse", "--verify", "HEAD"], projectDir, true);
  return result.trim().length > 0;
}
