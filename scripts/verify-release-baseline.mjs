#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [workspacePath, tagPrefix] = process.argv.slice(2);

if (!workspacePath || !tagPrefix) {
  console.error("Usage: node scripts/verify-release-baseline.mjs <workspace-path> <tag-prefix>");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(`${workspacePath}/package.json`, "utf8"));
const existingTags = execFileSync("git", ["tag", "--list", `${tagPrefix}*`], {
  encoding: "utf8"
}).trim();

if (existingTags) {
  process.exit(0);
}

console.error(
  [
    `No baseline release tag found for ${pkg.name}.`,
    `semantic-release defaults the first release to 1.0.0 when no prior ${tagPrefix}* tag exists.`,
    `Seed the historical baseline before enabling CI releases:`,
    `  git tag ${tagPrefix}${pkg.version}`,
    `  git push origin ${tagPrefix}${pkg.version}`
  ].join("\n")
);

process.exit(1);
