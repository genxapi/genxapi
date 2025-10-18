import { defineConfig } from "rollup";
import dts from "rollup-plugin-dts";
import del from "rollup-plugin-delete";
import typescript from "@rollup/plugin-typescript";

export default defineConfig([
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "esm",
        sourcemap: true
      }
    ],
    plugins: [
      del({ targets: "dist/*", hook: "buildStart" }),
      typescript({ tsconfig: "./tsconfig.json", outputToFilesystem: true })
    ],
    external: [
      "fs-extra",
      "globby",
      "merge-deep",
      "pathe",
      "zod",
      "@orval/core"
    ]
  },
  {
    input: "dist/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [
      dts(),
      del({ hook: "buildEnd", targets: "dist/src", verbose: true })
    ]
  }
]);
