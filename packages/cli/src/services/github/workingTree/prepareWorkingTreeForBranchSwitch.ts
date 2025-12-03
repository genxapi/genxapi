import fsExtra from "fs-extra";
import { join } from "node:path";

import type { Logger } from "../../../utils/logger";
import { runGit } from "../git/runGit";

const { copy, emptyDir, pathExists, remove } = fsExtra;

/**
 * Prepares the working tree for switching branches by stashing or backing up dirty files.
 *
 * @param projectDir - Project directory.
 * @param hasAnyCommits - Whether the repository already has commits.
 * @param workingTreeStatus - Porcelain status output.
 * @param logger - Logger for debug output.
 * @returns A restore callback to re-apply local changes, or null when no changes existed.
 */
export async function prepareWorkingTreeForBranchSwitch(
  projectDir: string,
  hasAnyCommits: boolean,
  workingTreeStatus: string,
  logger: Logger
): Promise<(() => Promise<void>) | null> {
  if (!workingTreeStatus) {
    return null;
  }

  if (hasAnyCommits) {
    logger.debug?.("Stashing local changes before switching branches.");
    await runGit(
      ["stash", "push", "--include-untracked", "-m", "genxapi-auto-stash"],
      projectDir
    );
    return async () => {
      await runGit(["stash", "pop"], projectDir, true);
    };
  }

  logger.debug?.("Backing up working tree (no commits yet) before switching branches.");
  const dirtyPaths = parseStatusPaths(workingTreeStatus);
  if (dirtyPaths.length === 0) {
    return null;
  }
  const restore = await backupWorkingTree(projectDir, dirtyPaths);
  await removeWorkingTreePaths(projectDir, dirtyPaths);
  return restore;
}

/**
 * Extracts file paths from porcelain git status output.
 */
function parseStatusPaths(status: string): string[] {
  return status
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .flatMap((line) => {
      if (line.length <= 3) {
        return [];
      }
      const rawPath = line.slice(3);
      if (rawPath.includes(" -> ")) {
        const [source, target] = rawPath.split(" -> ");
        return [source, target];
      }
      return [rawPath];
    });
}

/**
 * Removes the specified paths from the working tree, ignoring failures.
 */
async function removeWorkingTreePaths(projectDir: string, paths: string[]): Promise<void> {
  await Promise.all(
    paths.map(async (relativePath) => {
      const target = join(projectDir, relativePath);
      await remove(target).catch(() => {});
    })
  );
}

/**
 * Copies dirty files to a temporary backup inside .git, returning a restore function.
 */
async function backupWorkingTree(
  projectDir: string,
  paths: string[]
): Promise<() => Promise<void>> {
  const gitDir = join(projectDir, ".git");
  const backupDir = join(gitDir, "genxapi-working-tree-backup");

  await remove(backupDir).catch(() => {});
  await emptyDir(backupDir);
  for (const relativePath of paths) {
    const source = join(projectDir, relativePath);
    if (!(await pathExists(source))) {
      continue;
    }
    const destination = join(backupDir, relativePath);
    await copy(source, destination, { overwrite: true });
  }

  return async () => {
    try {
      for (const relativePath of paths) {
        const source = join(backupDir, relativePath);
        if (!(await pathExists(source))) {
          continue;
        }
        const destination = join(projectDir, relativePath);
        await copy(source, destination, { overwrite: true });
      }
    } finally {
      await remove(backupDir).catch(() => {});
    }
  };
}
