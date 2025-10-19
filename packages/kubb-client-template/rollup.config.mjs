import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from "rollup-plugin-dts";
import fs from "fs-extra";

const copyTemplate = () => ({
  name: "copy-template",
  async writeBundle() {
    await fs.copy("src/template", "dist/template", {
      overwrite: true,
      dereference: true
    });
    await fs.copyFile("src/template/.npmrc", "dist/template/.npmrc");
  }
});

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
      typescript({ tsconfig: "./tsconfig.json", outputToFilesystem: true }),
      copyTemplate()
    ],
    external: [
      "cosmiconfig",
      "execa",
      "fs-extra",
      "globby",
      "merge-deep",
      "pathe",
      "yaml",
      "zod",
      "node:fs",
      "node:fs/promises",
      "node:path",
      "node:url"
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
