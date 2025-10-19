import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/template-orval/src/**/*.test.ts",
      "packages/template-kubb/src/**/*.test.ts",
      "packages/cli/src/**/*.test.ts"
    ],
    coverage: {
      reporter: ["text", "lcov"]
    }
  }
});
