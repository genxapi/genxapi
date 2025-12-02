import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { cosmiconfig } from "cosmiconfig";
import { parseConfig } from "./parseConfig";

const MODULE_NAME = "genxapi";

export async function readConfigAtPath(path: string, cwd: string): Promise<{ config: unknown; dir: string }> {
  const absolutePath = resolve(cwd, path);
  const content = await readFile(absolutePath, "utf8");
  const parsed = parseConfig(content, absolutePath);
  return { config: parsed, dir: dirname(absolutePath) };
}

export async function searchConfig(cwd: string): Promise<{ config: unknown; dir: string }> {
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      `${MODULE_NAME}rc`,
      `${MODULE_NAME}rc.json`,
      `${MODULE_NAME}rc.yaml`,
      `${MODULE_NAME}rc.yml`,
      `${MODULE_NAME}.config.json`,
      `${MODULE_NAME}.config.yaml`,
      `${MODULE_NAME}.config.yml`
    ],
    loaders: {
      ".json": (filePath, content) => parseConfig(content, filePath),
      ".yaml": (filePath, content) => parseConfig(content, filePath),
      ".yml": (filePath, content) => parseConfig(content, filePath),
      noExt: (filePath, content) => parseConfig(content, filePath)
    }
  });

  const result = await explorer.search(cwd);
  if (!result || result.isEmpty) {
    throw new Error("Unable to find genxapi configuration.");
  }
  return { config: result.config, dir: dirname(result.filepath) };
}
