#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];

    if (!flag.startsWith("--")) {
      continue;
    }

    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Option ${flag} requires a value.`);
    }

    options[flag.slice(2)] = value;
    index += 1;
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const workspace = options.workspace;
  const tagPrefix = options["tag-prefix"] ?? options.tagPrefix;

  if (!workspace || !tagPrefix) {
    throw new Error("Usage: node scripts/verify-release-tag.mjs --workspace <name> --tag-prefix <prefix>");
  }

  const refName = process.env.GITHUB_REF_NAME;
  if (!refName) {
    throw new Error("GITHUB_REF_NAME is not set.");
  }

  const packageJsonPath = resolve("packages", workspace, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const expectedTag = `${tagPrefix}${packageJson.version}`;

  if (refName !== expectedTag) {
    throw new Error(`Tag ${refName} must match ${expectedTag} for ${packageJson.name}.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
