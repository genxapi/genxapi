import { execa } from "execa";

/**
 * Checks whether the repository already has a commit on HEAD.
 *
 * @param projectDir - Project directory.
 * @returns True when HEAD resolves successfully.
 */
export async function repositoryHasCommits(projectDir: string): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--verify", "HEAD"], {
      cwd: projectDir,
      stdio: "pipe"
    });
    return true;
  } catch {
    return false;
  }
}
