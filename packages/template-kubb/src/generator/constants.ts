import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC_TEMPLATE_PATH = fileURLToPath(new URL("../template", import.meta.url));
const DIST_TEMPLATE_PATH = fileURLToPath(new URL("../src/template", import.meta.url));

export const TEMPLATE_ROOT = existsSync(SRC_TEMPLATE_PATH) ? SRC_TEMPLATE_PATH : DIST_TEMPLATE_PATH;

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
