import { runGit } from "./runGit";

/**
 * Ensures git user.name and user.email are set locally for commits.
 *
 * @param projectDir - Project directory.
 */
export async function ensureGitUser(projectDir: string): Promise<void> {
  if (!(await hasGitConfig(projectDir, "user.email"))) {
    await runGit(["config", "user.email", "bot@genxapi.local"], projectDir);
  }
  if (!(await hasGitConfig(projectDir, "user.name"))) {
    await runGit(["config", "user.name", "API Client Generator"], projectDir);
  }
}

/**
 * Determines whether a git config key has a value.
 *
 * @param projectDir - Project directory.
 * @param key - Git config key.
 * @returns True when the config key exists.
 */
async function hasGitConfig(projectDir: string, key: string): Promise<boolean> {
  try {
    await runGit(["config", "--get", key], projectDir);
    return true;
  } catch {
    return false;
  }
}
