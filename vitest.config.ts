import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/api-client-template/src/**/*.test.ts",
      "packages/generate-api-client/src/**/*.test.ts"
    ],
    coverage: {
      reporter: ["text", "lcov"]
    }
  }
});
