import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from "rollup-plugin-dts";

export default defineConfig([
  {
    input: {
      index: "src/index.ts",
      cli: "src/cli.ts"
    },
    output: {
      dir: "dist",
      format: "esm",
      sourcemap: true,
      entryFileNames: "[name].js"
    },
    plugins: [
      del({ targets: "dist/*", hook: "buildStart" }),
      typescript({ tsconfig: "./tsconfig.build.json", outputToFilesystem: true })
    ],
    external: [
      "@genxapi/template-orval",
      "@genxapi/template-kubb",
      "merge-deep",
      "chalk",
      "@stricli/core",
      "cosmiconfig",
      "fs-extra",
      "octokit",
      "ora",
      "execa",
      "node:fs",
      "node:fs/promises",
      "node:path",
      "node:url",
      "yaml",
      "zod"
    ]
  },
  {
    input: "dist/types/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [
      dts(),
      del({ hook: "buildEnd", targets: ["dist/types", "dist/src"], verbose: true })
    ]
  }
]);
