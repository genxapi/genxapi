import { readFile } from "node:fs/promises";
import { relative as relativePath, resolve } from "pathe";
import fs from "fs-extra";
import YAML from "yaml";
import type { ClientConfig, MultiClientConfig, GenerateClientsOptions } from "../types.js";
import { ensureRelativePath } from "./pathHelpers.js";

export interface SwaggerInfo {
  readonly title?: string;
  readonly description?: string;
  readonly version?: string;
  readonly source: string;
}

export async function handleSwaggerDocuments(
  projectDir: string,
  config: MultiClientConfig,
  options: GenerateClientsOptions,
  logger: GenerateClientsOptions["logger"]
): Promise<{ targets: Record<string, string>; infos: Record<string, SwaggerInfo | null> }> {
  const targets: Record<string, string> = {};
  const infos: Record<string, SwaggerInfo | null> = {};

  for (const client of config.clients) {
    const sourceAbsolute = resolve(options.configDir ?? process.cwd(), client.swagger);
    if (client.copySwagger && !isHttp(client.swagger)) {
      const destination = resolve(projectDir, client.swaggerCopyTarget);
      logger?.info?.(`Copying ${client.swagger} -> ${client.swaggerCopyTarget}`);
      await fs.ensureDir(resolve(destination, ".."));
      await fs.copyFile(sourceAbsolute, destination);
      targets[client.name] = client.swaggerCopyTarget;
      infos[client.name] = await readSwaggerInfoFromFile(destination, client.swagger);
    } else if (!client.copySwagger && !isHttp(client.swagger)) {
      targets[client.name] = toProjectRelative(projectDir, sourceAbsolute, client.swagger);
      infos[client.name] = await readSwaggerInfoFromFile(sourceAbsolute, client.swagger);
    } else {
      targets[client.name] = client.swagger;
      infos[client.name] = await readSwaggerInfoFromRemote(client.swagger);
    }
  }

  return { targets, infos };
}

function isHttp(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function toProjectRelative(projectDir: string, absolute: string, original: string): string {
  if (isHttp(original)) {
    return original;
  }
  const relative = relativePath(projectDir, absolute);
  return relative === "" ? original : ensureRelativePath(relative.replace(/\\/g, "/"));
}

async function readSwaggerInfoFromFile(path: string, source: string): Promise<SwaggerInfo | null> {
  try {
    const content = await readFile(path, "utf8");
    const parsed = parseSwaggerSpec(content);
    if (!parsed) return { source };
    return { ...parsed, source };
  } catch {
    return { source };
  }
}

async function readSwaggerInfoFromRemote(url: string): Promise<SwaggerInfo | null> {
  if (typeof fetch !== "function") {
    return { source: url };
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { source: url };
    }
    const text = await response.text();
    const parsed = parseSwaggerSpec(text);
    if (!parsed) return { source: url };
    return { ...parsed, source: url };
  } catch {
    return { source: url };
  }
}

function parseSwaggerSpec(text: string): Omit<SwaggerInfo, "source"> | null {
  try {
    const asJson = JSON.parse(text);
    if (typeof asJson === "object" && asJson !== null) {
      const info = (asJson as { info?: Record<string, unknown> }).info ?? {};
      return {
        title: typeof info.title === "string" ? info.title : undefined,
        description: typeof info.description === "string" ? info.description : undefined,
        version: typeof info.version === "string" ? info.version : undefined
      };
    }
  } catch {
    try {
      const asYaml = YAML.parse(text);
      if (typeof asYaml === "object" && asYaml !== null) {
        const info = (asYaml as { info?: Record<string, unknown> }).info ?? {};
        return {
          title: typeof info.title === "string" ? info.title : undefined,
          description: typeof info.description === "string" ? info.description : undefined,
          version: typeof info.version === "string" ? info.version : undefined
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}
