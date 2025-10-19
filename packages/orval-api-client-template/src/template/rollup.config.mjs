import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from "rollup-plugin-dts";

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
      typescript({ tsconfig: "./tsconfig.build.json" })
    ],
    external: ["react", "@tanstack/react-query"]
  },
  {
    input: "dist/types/src/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [
      dts(),
      del({ hook: "buildEnd", targets: "dist/types" })
    ]
  }
]);
