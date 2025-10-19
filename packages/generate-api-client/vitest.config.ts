import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    alias: {
      "@cli": path.resolve(__dirname, "src"),
      "@eduardoac/orval-api-client-template": path.resolve(
        __dirname,
        "../orval-api-client-template/src"
      ),
      "@eduardoac/kubb-api-client-template": path.resolve(
        __dirname,
        "../kubb-api-client-template/src"
      )
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
