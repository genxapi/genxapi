import { readFile } from "node:fs/promises";
import { relative as relativePath, resolve } from "node:path";
import fs from "fs-extra";
import YAML from "yaml";
import type { MultiClientConfig, GenerateClientsOptions } from "../types.js";

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
    const resolvedContract = options.resolvedContracts?.[client.name];
    if (resolvedContract) {
      targets[client.name] = resolvedContract.generatorInput;
      infos[client.name] = resolvedContract.info;
      continue;
    }

    const source = client.contract?.source ?? client.swagger;
    if (!source) {
      throw new Error(`Client "${client.name}" does not define a swagger or contract source.`);
    }
    const snapshotEnabled =
      typeof client.contract?.snapshot === "boolean"
        ? client.contract.snapshot
        : client.contract?.snapshot
          ? true
          : client.copySwagger;
    const snapshotPath =
      typeof client.contract?.snapshot === "object" && client.contract.snapshot
        ? client.contract.snapshot.path ?? client.swaggerCopyTarget
        : client.swaggerCopyTarget;

    if (client.contract?.auth && isHttp(source)) {
      throw new Error(
        `Client "${client.name}" defines remote contract auth. Resolve this configuration through @genxapi/cli so secrets can be applied without leaking into generator config.`
      );
    }

    const sourceAbsolute = resolve(options.configDir ?? process.cwd(), source);
    if (snapshotEnabled && !isHttp(source)) {
      const destination = resolve(projectDir, snapshotPath);
      logger?.info?.(`Copying ${source} -> ${snapshotPath}`);
      await fs.ensureDir(resolve(destination, ".."));
      await fs.copyFile(sourceAbsolute, destination);
      targets[client.name] = snapshotPath;
      infos[client.name] = await readSwaggerInfoFromFile(destination, source);
    } else if (!snapshotEnabled && !isHttp(source)) {
      targets[client.name] = toProjectRelative(projectDir, sourceAbsolute, source);
      infos[client.name] = await readSwaggerInfoFromFile(sourceAbsolute, source);
    } else if (snapshotEnabled && isHttp(source)) {
      const destination = resolve(projectDir, snapshotPath);
      logger?.info?.(`Snapshotting ${source} -> ${snapshotPath}`);
      await fs.ensureDir(resolve(destination, ".."));
      const text = await fetchSwaggerDocument(source);
      await fs.writeFile(destination, text, "utf8");
      targets[client.name] = snapshotPath;
      infos[client.name] = await readSwaggerInfoFromFile(destination, source);
    } else {
      targets[client.name] = source;
      infos[client.name] = await readSwaggerInfoFromRemote(source);
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
  return relative === "" ? original : relative.replace(/\\/g, "/");
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
    const text = await fetchSwaggerDocument(url);
    const parsed = parseSwaggerSpec(text);
    if (!parsed) return { source: url };
    return { ...parsed, source: url };
  } catch {
    return { source: url };
  }
}

async function fetchSwaggerDocument(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch swagger document from ${url}.`);
  }
  return response.text();
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
