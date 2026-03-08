import path from "node:path";
import { execFileSync } from "node:child_process";

import { analyzeCommits as analyzeWithCommitAnalyzer } from "@semantic-release/commit-analyzer";
import { generateNotes as generateWithReleaseNotes } from "@semantic-release/release-notes-generator";

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

async function getGitRoot(cwd) {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8"
  }).trim();
}

async function getCommitFiles(hash, cwd) {
  return execFileSync("git", ["show", "--format=", "--name-only", hash], {
    cwd,
    encoding: "utf8"
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

async function withScopedCommits(context) {
  const gitRoot = await getGitRoot(context.cwd);
  const packagePath = path.relative(gitRoot, context.cwd);
  const normalizedPackagePath = toPosixPath(packagePath);
  const packagePrefix = normalizedPackagePath ? `${normalizedPackagePath}/` : "";
  const commits = context.commits ?? [];

  const scopedCommits = (
    await Promise.all(
      commits.map(async (commit) => ({
        ...commit,
        files: await getCommitFiles(commit.hash, context.cwd)
      }))
    )
  ).filter(({ files }) =>
    files.some((file) => {
      const normalizedFile = toPosixPath(path.normalize(file));

      if (!normalizedPackagePath) {
        return true;
      }

      return normalizedFile === normalizedPackagePath || normalizedFile.startsWith(packagePrefix);
    })
  );

  context.logger.log(
    "Found %s relevant commits for package path %s",
    scopedCommits.length,
    normalizedPackagePath || "."
  );

  return {
    ...context,
    commits: scopedCommits
  };
}

export async function analyzeCommits(pluginConfig, context) {
  return analyzeWithCommitAnalyzer(pluginConfig, await withScopedCommits(context));
}

export async function generateNotes(pluginConfig, context) {
  return generateWithReleaseNotes(pluginConfig, await withScopedCommits(context));
}
