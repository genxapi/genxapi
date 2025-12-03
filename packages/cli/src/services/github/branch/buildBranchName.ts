import fsExtra from "fs-extra";
import { join } from "node:path";

import type { PullRequestConfig } from "../types";

const { readJson } = fsExtra;

/**
 * Builds a deterministic branch name for generated changes.
 *
 * @param config - Pull request configuration.
 * @param projectDir - Project directory used to read package version.
 * @returns Branch name including prefix and version/timestamp.
 */
export async function buildBranchName(
  config: PullRequestConfig,
  projectDir: string
): Promise<string> {
  const prefix = config.branchPrefix || "fix/generated-package";
  const version = await readPackageVersion(projectDir);
  const suffix = version ?? new Date().toISOString().replace(/[:.]/g, "-");
  const safeSuffix = suffix.replace(/[^0-9A-Za-z.-]/g, "-");
  return `${prefix}-${safeSuffix}`;
}

/**
 * Reads the package version from package.json if present.
 */
async function readPackageVersion(projectDir: string): Promise<string | null> {
  try {
    const pkg = await readJson(join(projectDir, "package.json"));
    if (pkg && typeof pkg.version === "string") {
      return pkg.version;
    }
  } catch {
    return null;
  }
  return null;
}
