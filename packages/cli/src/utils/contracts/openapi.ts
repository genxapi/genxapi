import YAML from "yaml";

export interface ParsedOpenApiInfo {
  readonly title?: string;
  readonly description?: string;
  readonly version?: string;
}

export interface ParsedOpenApiDocument {
  readonly document: Record<string, unknown>;
  readonly info: ParsedOpenApiInfo;
}

export function parseOpenApiText(text: string): ParsedOpenApiDocument | null {
  const parsed = parseObject(text);
  if (!parsed) {
    return null;
  }

  const info = extractInfo(parsed);
  return {
    document: parsed,
    info,
  };
}

function parseObject(text: string): Record<string, unknown> | null {
  try {
    return asObject(JSON.parse(text));
  } catch {
    try {
      return asObject(YAML.parse(text));
    } catch {
      return null;
    }
  }
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function extractInfo(document: Record<string, unknown>): ParsedOpenApiInfo {
  const info =
    typeof document.info === "object" && document.info !== null && !Array.isArray(document.info)
      ? (document.info as Record<string, unknown>)
      : {};

  return {
    title: typeof info.title === "string" ? info.title : undefined,
    description: typeof info.description === "string" ? info.description : undefined,
    version: typeof info.version === "string" ? info.version : undefined,
  };
}
