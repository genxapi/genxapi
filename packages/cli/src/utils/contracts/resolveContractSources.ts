import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative as relativePath, resolve } from "node:path";
import fs from "fs-extra";
import YAML from "yaml";

export interface ContractResolutionLogger {
  info?(message: string): void;
  warn?(message: string): void;
  error?(message: string): void;
  debug?(message: string): void;
}

export interface ResolvedSwaggerInfo {
  readonly title?: string;
  readonly description?: string;
  readonly version?: string;
  readonly source: string;
}

export interface ResolvedContractSource {
  readonly source: string;
  readonly type: "local" | "remote";
  readonly resolvedSource: string;
  readonly generatorInput: string;
  readonly snapshot: {
    readonly enabled: boolean;
    readonly path?: string;
  };
  readonly checksum?: {
    readonly algorithm: "sha256" | "sha512";
    readonly value: string;
  };
  readonly metadata: {
    readonly fetchedAt?: string;
    readonly httpStatus?: number;
    readonly contentType?: string;
    readonly etag?: string;
    readonly lastModified?: string;
    readonly sizeBytes: number;
    readonly auth?:
      | {
          readonly type: "bearer";
          readonly tokenEnv: string;
          readonly scheme: string;
        }
      | {
          readonly type: "basic";
          readonly usernameEnv: string;
          readonly passwordEnv: string;
        }
      | {
          readonly type: "header";
          readonly headerName: string;
          readonly valueEnv: string;
          readonly prefix?: string;
        };
  };
  readonly info: ResolvedSwaggerInfo | null;
}

interface ClientContractInput {
  readonly name: string;
  readonly swagger?: string;
  readonly contract?: {
    readonly source?: string;
    readonly auth?:
      | {
          readonly type: "bearer";
          readonly tokenEnv: string;
          readonly scheme?: string;
        }
      | {
          readonly type: "basic";
          readonly usernameEnv: string;
          readonly passwordEnv: string;
        }
      | {
          readonly type: "header";
          readonly headerName: string;
          readonly valueEnv: string;
          readonly prefix?: string;
        };
    readonly checksum?:
      | boolean
      | {
          readonly algorithm?: "sha256" | "sha512";
        };
    readonly snapshot?:
      | boolean
      | {
          readonly path?: string;
        };
  };
  readonly copySwagger?: boolean;
  readonly swaggerCopyTarget?: string;
}

type ContractAuthInput = NonNullable<NonNullable<ClientContractInput["contract"]>["auth"]>;
type ContractChecksumInput = NonNullable<NonNullable<ClientContractInput["contract"]>["checksum"]>;

export interface ResolveContractSourcesOptions {
  readonly configDir: string;
  readonly projectDir: string;
  readonly clients: readonly ClientContractInput[];
  readonly logger?: ContractResolutionLogger;
  readonly writeSnapshots?: boolean;
}

export async function resolveContractSources(
  options: ResolveContractSourcesOptions,
): Promise<Record<string, ResolvedContractSource>> {
  if (options.writeSnapshots !== false) {
    await fs.ensureDir(options.projectDir);
  }

  const resolvedEntries = await Promise.all(
    options.clients.map(async (client) => {
      const resolved = await resolveClientContract(client, options);
      return [client.name, resolved] as const;
    }),
  );

  return Object.fromEntries(resolvedEntries);
}

async function resolveClientContract(
  client: ClientContractInput,
  options: ResolveContractSourcesOptions,
): Promise<ResolvedContractSource> {
  const source = client.contract?.source ?? client.swagger;
  if (!source) {
    throw new Error(`Client "${client.name}" does not define a contract source.`);
  }

  const type = isHttp(source) ? "remote" : "local";
  const snapshot = normaliseSnapshot(client, type);
  const checksumAlgorithm = normaliseChecksumAlgorithm(client.contract?.checksum);
  const auth = client.contract?.auth;

  if (type === "remote" && auth && !snapshot.enabled) {
    throw new Error(
      `Client "${client.name}" disables snapshotting for an authenticated remote contract. Protected remote contracts must be snapshotted so generators do not need direct access to secrets.`,
    );
  }

  if (type === "local" && auth) {
    options.logger?.warn?.(
      `Client "${client.name}" defines contract auth for a local source. The auth block is ignored for local files.`,
    );
  }

  if (type === "remote" && !snapshot.enabled) {
    options.logger?.warn?.(
      `Client "${client.name}" uses a live remote contract without snapshotting. Generation will remain sensitive to upstream changes.`,
    );
  }

  const loaded =
    type === "remote"
      ? await loadRemoteContract(client.name, source, auth, options.logger)
      : await loadLocalContract(client.name, source, options.configDir, options.logger);

  const checksum = checksumAlgorithm
    ? {
        algorithm: checksumAlgorithm,
        value: createHash(checksumAlgorithm).update(loaded.content).digest("hex"),
      }
    : undefined;

  const snapshotPath = snapshot.enabled ? normaliseSnapshotPath(snapshot.path, client) : undefined;
  if (snapshotPath && options.writeSnapshots !== false) {
    const snapshotAbsolute = resolve(options.projectDir, snapshotPath);
    await fs.ensureDir(dirname(snapshotAbsolute));
    await writeFile(snapshotAbsolute, loaded.content, "utf8");
  }

  const generatorInput = snapshotPath
    ? snapshotPath
    : type === "remote"
      ? source
      : toProjectRelative(options.projectDir, loaded.resolvedSource, source);

  return {
    source,
    type,
    resolvedSource: loaded.resolvedSource,
    generatorInput,
    snapshot: {
      enabled: snapshot.enabled,
      path: snapshotPath,
    },
    checksum,
    metadata: {
      ...loaded.metadata,
      auth: loaded.metadata.auth,
    },
    info: buildSwaggerInfo(loaded.content, source),
  };
}

async function loadLocalContract(
  clientName: string,
  source: string,
  configDir: string,
  logger?: ContractResolutionLogger,
): Promise<{
  readonly content: string;
  readonly resolvedSource: string;
  readonly metadata: ResolvedContractSource["metadata"];
}> {
  const absolute = resolve(configDir, source);
  logger?.info?.(`Resolving local contract for ${clientName} from ${source}.`);
  const content = await readFile(absolute, "utf8");

  return {
    content,
    resolvedSource: absolute,
    metadata: {
      sizeBytes: Buffer.byteLength(content, "utf8"),
    },
  };
}

async function loadRemoteContract(
  clientName: string,
  source: string,
  auth: ContractAuthInput | undefined,
  logger?: ContractResolutionLogger,
): Promise<{
  readonly content: string;
  readonly resolvedSource: string;
  readonly metadata: ResolvedContractSource["metadata"];
}> {
  if (typeof fetch !== "function") {
    throw new Error(`Client "${clientName}" uses a remote contract but fetch is unavailable.`);
  }

  const { headers, authMetadata } = buildRemoteHeaders(clientName, auth);
  logger?.info?.(
    `Resolving remote contract for ${clientName} from ${sanitiseSourceForLog(source)}${describeAuthSuffix(authMetadata)}.`,
  );

  const response = await fetch(source, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch remote contract for "${clientName}" from ${sanitiseSourceForLog(source)} (${response.status} ${response.statusText}).`,
    );
  }

  const content = await response.text();

  return {
    content,
    resolvedSource: response.url || source,
    metadata: {
      fetchedAt: new Date().toISOString(),
      httpStatus: response.status,
      contentType: response.headers.get("content-type") ?? undefined,
      etag: response.headers.get("etag") ?? undefined,
      lastModified: response.headers.get("last-modified") ?? undefined,
      sizeBytes: Buffer.byteLength(content, "utf8"),
      auth: authMetadata,
    },
  };
}

function buildRemoteHeaders(
  clientName: string,
  auth: ContractAuthInput | undefined,
): {
  readonly headers: Record<string, string>;
  readonly authMetadata: ResolvedContractSource["metadata"]["auth"];
} {
  if (!auth) {
    return {
      headers: {},
      authMetadata: undefined,
    };
  }

  switch (auth.type) {
    case "bearer": {
      const token = requireEnv(auth.tokenEnv, clientName);
      const scheme = auth.scheme ?? "Bearer";
      return {
        headers: {
          Authorization: `${scheme} ${token}`,
        },
        authMetadata: {
          type: "bearer",
          tokenEnv: auth.tokenEnv,
          scheme,
        },
      };
    }
    case "basic": {
      const username = requireEnv(auth.usernameEnv, clientName);
      const password = requireEnv(auth.passwordEnv, clientName);
      const encoded = Buffer.from(`${username}:${password}`).toString("base64");
      return {
        headers: {
          Authorization: `Basic ${encoded}`,
        },
        authMetadata: {
          type: "basic",
          usernameEnv: auth.usernameEnv,
          passwordEnv: auth.passwordEnv,
        },
      };
    }
    case "header": {
      const value = requireEnv(auth.valueEnv, clientName);
      return {
        headers: {
          [auth.headerName]: auth.prefix ? `${auth.prefix} ${value}` : value,
        },
        authMetadata: {
          type: "header",
          headerName: auth.headerName,
          valueEnv: auth.valueEnv,
          prefix: auth.prefix,
        },
      };
    }
    default:
      return {
        headers: {},
        authMetadata: undefined,
      };
  }
}

function requireEnv(name: string, clientName: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name} required to resolve the contract for client "${clientName}".`,
    );
  }
  return value;
}

function describeAuthSuffix(auth: ResolvedContractSource["metadata"]["auth"]): string {
  if (!auth) {
    return "";
  }

  switch (auth.type) {
    case "bearer":
      return ` using ${auth.scheme} auth from ${auth.tokenEnv}`;
    case "basic":
      return ` using basic auth from ${auth.usernameEnv}/${auth.passwordEnv}`;
    case "header":
      return ` using ${auth.headerName} from ${auth.valueEnv}`;
    default:
      return "";
  }
}

function normaliseSnapshot(
  client: ClientContractInput,
  sourceType: "local" | "remote",
): {
  readonly enabled: boolean;
  readonly path?: string;
} {
  const snapshot = client.contract?.snapshot;
  if (typeof snapshot === "boolean") {
    return { enabled: snapshot };
  }
  if (snapshot && typeof snapshot === "object") {
    return {
      enabled: true,
      path: snapshot.path,
    };
  }

  if (typeof client.copySwagger === "boolean") {
    return {
      enabled: client.copySwagger,
    };
  }

  return {
    enabled: sourceType === "remote",
  };
}

function normaliseSnapshotPath(path: string | undefined, client: ClientContractInput): string {
  const resolved = path ?? client.swaggerCopyTarget;
  if (!resolved) {
    throw new Error(
      `Client "${client.name}" enables contract snapshots but does not define a snapshot path.`,
    );
  }
  if (isAbsolute(resolved)) {
    throw new Error(
      `Client "${client.name}" defines snapshot path "${resolved}", but snapshot paths must stay within the generated project.`,
    );
  }
  return resolved.replace(/\\/g, "/");
}

function normaliseChecksumAlgorithm(
  checksum: ContractChecksumInput | undefined,
): "sha256" | "sha512" | undefined {
  if (!checksum) {
    return undefined;
  }
  if (checksum === true) {
    return "sha256";
  }
  return checksum.algorithm ?? "sha256";
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

function buildSwaggerInfo(text: string, source: string): ResolvedSwaggerInfo | null {
  const parsed = parseSwaggerSpec(text);
  if (!parsed) {
    return { source };
  }
  return {
    ...parsed,
    source,
  };
}

function parseSwaggerSpec(text: string): Omit<ResolvedSwaggerInfo, "source"> | null {
  try {
    const asJson = JSON.parse(text);
    if (typeof asJson === "object" && asJson !== null) {
      const info = (asJson as { info?: Record<string, unknown> }).info ?? {};
      return {
        title: typeof info.title === "string" ? info.title : undefined,
        description: typeof info.description === "string" ? info.description : undefined,
        version: typeof info.version === "string" ? info.version : undefined,
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
          version: typeof info.version === "string" ? info.version : undefined,
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function sanitiseSourceForLog(source: string): string {
  if (!isHttp(source)) {
    return source;
  }
  try {
    const parsed = new URL(source);
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return source.replace(/(https?:\/\/)([^@\s]+)@/gi, "$1[REDACTED]@");
  }
}
