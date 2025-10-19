import { rm } from "node:fs/promises";

const targets = [
  "packages/api-client-template/dist",
  "packages/kubb-client-template/dist",
  "packages/generate-api-client/dist",
  "packages/api-client-template/coverage",
  "packages/kubb-client-template/coverage",
  "packages/generate-api-client/coverage"
];

await Promise.all(
  targets.map(async (target) => {
    await rm(target, { recursive: true, force: true });
  })
);
