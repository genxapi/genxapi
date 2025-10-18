import { readFile } from "node:fs/promises";
import { resolve, dirname } from "pathe";
import { cosmiconfig } from "cosmiconfig";
import YAML from "yaml";
import { CliConfigSchema, type CliConfig } from "./schema.js";

const MODULE_NAME = "generate-api-client";

export interface LoadCliConfigOptions {
  readonly cwd?: string;
  readonly file?: string;
}

export async function loadCliConfig(options: LoadCliConfigOptions = {}): Promise<{
  config: CliConfig;
  configDir: string;
}> {
  if (options.file) {
    const cwd = options.cwd ?? process.cwd();
    const path = resolve(cwd, options.file);
    const content = await readFile(path, "utf8");
    const parsed = parseConfig(content, path);
    return { config: CliConfigSchema.parse(parsed), configDir: dirname(path) };
  }

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

  const result = await explorer.search(options.cwd ?? process.cwd());
  if (!result || result.isEmpty) {
    throw new Error("Unable to find generate-api-client configuration.");
  }

  return {
    config: CliConfigSchema.parse(result.config),
    configDir: dirname(result.filepath)
  };
}

function parseConfig(content: string, filePath: string) {
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
    return YAML.parse(content);
  }
  return JSON.parse(content);
}
