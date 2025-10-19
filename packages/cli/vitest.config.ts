import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    alias: {
      "@cli": path.resolve(__dirname, "src"),
      "@genxapi/template-orval": path.resolve(__dirname, "../template-orval/src"),
      "@genxapi/template-kubb": path.resolve(__dirname, "../template-kubb/src")
    },
    deps: {
      optimizer: {
        web: {
          considerBuiltins: true
        }
      }
    }
  }
});
