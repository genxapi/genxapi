import { rm } from "node:fs/promises";

const targets = [
  "packages/template-orval/dist",
  "packages/template-kubb/dist",
  "packages/cli/dist",
  "packages/template-orval/coverage",
  "packages/template-kubb/coverage",
  "packages/cli/coverage"
];

await Promise.all(
  targets.map(async (target) => {
    await rm(target, { recursive: true, force: true });
  })
);
