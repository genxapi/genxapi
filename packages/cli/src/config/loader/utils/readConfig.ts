import { dirname, resolve } from "node:path";
import { cosmiconfig } from "cosmiconfig";

const MODULE_NAME = "genxapi";

const SEARCH_PLACES = [
  `${MODULE_NAME}rc`,
  `${MODULE_NAME}rc.json`,
  `${MODULE_NAME}rc.yaml`,
  `${MODULE_NAME}rc.yml`,
  `${MODULE_NAME}rc.ts`,
  `${MODULE_NAME}.config.json`,
  `${MODULE_NAME}.config.yaml`,
  `${MODULE_NAME}.config.yml`,
  `${MODULE_NAME}.config.ts`
] as const;

export async function readConfigAtPath(path: string, cwd: string): Promise<{ config: unknown; dir: string }> {
  const absolutePath = resolve(cwd, path);
  const explorer = createExplorer();
  const result = await explorer.load(absolutePath);

  if (!result || result.isEmpty) {
    throw new Error(`Unable to load genxapi configuration from ${absolutePath}.`);
  }

  return { config: result.config, dir: dirname(result.filepath) };
}

export async function searchConfig(cwd: string): Promise<{ config: unknown; dir: string }> {
  const explorer = createExplorer();
  const result = await explorer.search(cwd);
  if (!result || result.isEmpty) {
    throw new Error("Unable to find genxapi configuration.");
  }
  return { config: result.config, dir: dirname(result.filepath) };
}

function createExplorer() {
  return cosmiconfig(MODULE_NAME, {
    searchPlaces: [...SEARCH_PLACES]
  });
}
