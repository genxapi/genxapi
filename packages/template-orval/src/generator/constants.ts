import { fileURLToPath } from "node:url";

export const TEMPLATE_ROOT = fileURLToPath(new URL("../template", import.meta.url));

export const TEXT_EXTENSIONS = new Set([
  ".json",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".txt",
  ".yaml",
  ".yml",
  ".tsconfig"
]);
