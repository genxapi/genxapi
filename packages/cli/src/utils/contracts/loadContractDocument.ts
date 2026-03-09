import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseOpenApiText } from "./openapi";
import {
  sanitiseSourceForLog,
  type ContractResolutionLogger,
  type ResolvedContractSource,
  type ResolvedSwaggerInfo,
} from "./resolveContractSources";

export interface LoadContractDocumentOptions {
  readonly source: string;
  readonly cwd?: string;
  readonly logger?: ContractResolutionLogger;
  readonly label?: string;
}

export interface LoadedContractDocument {
  readonly source: string;
  readonly type: "local" | "remote";
  readonly resolvedSource: string;
  readonly metadata: ResolvedContractSource["metadata"];
  readonly info: ResolvedSwaggerInfo | null;
  readonly document: Record<string, unknown>;
}

export async function loadContractDocument(
  options: LoadContractDocumentOptions,
): Promise<LoadedContractDocument> {
  const sourceType = isHttp(options.source) ? "remote" : "local";
  const loaded =
    sourceType === "remote"
      ? await loadRemoteContractDocument(options)
      : await loadLocalContractDocument(options);
  const parsed = parseOpenApiText(loaded.content);

  if (!parsed) {
    throw new Error(
      `Unable to parse ${describeContract(options)} as JSON or YAML OpenAPI content.`,
    );
  }

  return {
    source: options.source,
    type: sourceType,
    resolvedSource: loaded.resolvedSource,
    metadata: loaded.metadata,
    info: {
      ...parsed.info,
      source: options.source,
    },
    document: parsed.document,
  };
}

async function loadLocalContractDocument(
  options: LoadContractDocumentOptions,
): Promise<{
  readonly content: string;
  readonly resolvedSource: string;
  readonly metadata: ResolvedContractSource["metadata"];
}> {
  const cwd = options.cwd ?? process.cwd();
  const absolute = resolve(cwd, options.source);
  options.logger?.info?.(
    `Resolving ${describeContract(options)} from local file ${options.source}.`,
  );
  const content = await readFile(absolute, "utf8");

  return {
    content,
    resolvedSource: absolute,
    metadata: {
      sizeBytes: Buffer.byteLength(content, "utf8"),
    },
  };
}

async function loadRemoteContractDocument(
  options: LoadContractDocumentOptions,
): Promise<{
  readonly content: string;
  readonly resolvedSource: string;
  readonly metadata: ResolvedContractSource["metadata"];
}> {
  if (typeof fetch !== "function") {
    throw new Error(`Unable to resolve ${describeContract(options)} because fetch is unavailable.`);
  }

  options.logger?.info?.(
    `Resolving ${describeContract(options)} from ${sanitiseSourceForLog(options.source)}.`,
  );

  const response = await fetch(options.source);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${describeContract(options)} from ${sanitiseSourceForLog(options.source)} (${response.status} ${response.statusText}).`,
    );
  }

  const content = await response.text();

  return {
    content,
    resolvedSource: response.url || options.source,
    metadata: {
      fetchedAt: new Date().toISOString(),
      httpStatus: response.status,
      contentType: response.headers.get("content-type") ?? undefined,
      etag: response.headers.get("etag") ?? undefined,
      lastModified: response.headers.get("last-modified") ?? undefined,
      sizeBytes: Buffer.byteLength(content, "utf8"),
    },
  };
}

function isHttp(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function describeContract(options: LoadContractDocumentOptions): string {
  return options.label ? `${options.label} contract` : "contract";
}
