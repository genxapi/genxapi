import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cosmiconfig } from "cosmiconfig";
import { MultiClientConfig, MultiClientConfigSchema } from "./types.js";

const MODULE_NAME = "genxapi";

export interface LoadConfigOptions {
  readonly cwd?: string;
  readonly configPath?: string;
}

export async function loadTemplateConfig(
  input: string | MultiClientConfig,
  options: LoadConfigOptions = {}
): Promise<MultiClientConfig> {
  if (typeof input !== "string") {
    return MultiClientConfigSchema.parse(input);
  }

  const cwd = options.cwd ?? process.cwd();
  const absolutePath = resolve(cwd, input);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  return MultiClientConfigSchema.parse(parsed);
}

export async function searchTemplateConfig(options: LoadConfigOptions = {}): Promise<MultiClientConfig> {
  const cwd = options.cwd ?? process.cwd();
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      `${MODULE_NAME}rc`,
      `${MODULE_NAME}rc.json`,
      `${MODULE_NAME}rc.yaml`,
      `${MODULE_NAME}rc.yml`,
      `${MODULE_NAME}.config.json`,
      `${MODULE_NAME}.config.yaml`,
      `${MODULE_NAME}.config.yml`
    ]
  });

  const result = options.configPath
    ? await explorer.load(resolve(cwd, options.configPath))
    : await explorer.search(cwd);

  if (!result || result.isEmpty) {
    throw new Error("Unable to locate genxapi configuration.");
  }

  return MultiClientConfigSchema.parse(result.config);
}
