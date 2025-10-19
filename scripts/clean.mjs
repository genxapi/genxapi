import { rm } from "node:fs/promises";

const targets = [
  "packages/orval-api-client-template/dist",
  "packages/kubb-api-client-template/dist",
  "packages/generate-api-client/dist",
  "packages/orval-api-client-template/coverage",
  "packages/kubb-api-client-template/coverage",
  "packages/generate-api-client/coverage"
];

await Promise.all(
  targets.map(async (target) => {
    await rm(target, { recursive: true, force: true });
  })
);
