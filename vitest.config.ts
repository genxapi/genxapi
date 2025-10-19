import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/orval-api-client-template/src/**/*.test.ts",
      "packages/kubb-api-client-template/src/**/*.test.ts",
      "packages/generate-api-client/src/**/*.test.ts"
    ],
    coverage: {
      reporter: ["text", "lcov"]
    }
  }
});
