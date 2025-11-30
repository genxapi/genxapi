import YAML from "yaml";

export function parseConfig(content: string, filePath: string): unknown {
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
    return YAML.parse(content);
  }
  return JSON.parse(content);
}
