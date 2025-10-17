import { dirname, isAbsolute, join, resolve as resolvePath } from "node:path";
import { cosmiconfig, defaultLoaders } from "cosmiconfig";
import { ZodError } from "zod";
import { Logger } from "./logger.js";
import {
  GeneratorConfig,
  GeneratorConfigSchema,
  OrvalOptions,
  PackageManager,
  ResolvedGeneratorConfig,
} from "./types.js";

interface LoadOptions {
  configPath?: string;
  workingDirectory: string;
  logger: Logger;
  overrides?: ConfigOverrides;
}

type ConfigOverrides = Partial<
  Omit<
    GeneratorConfig,
    "templateVariables" | "orval" | "packageManager" | "targetDirectory" | "swaggerPath"
  >
> & {
  readonly templateVariables?: Record<string, string>;
  readonly orval?: Partial<OrvalOptions>;
  readonly packageManager?: PackageManager | string;
  readonly targetDirectory?: string;
  readonly swaggerPath?: string;
};

const MODULE_NAME = "api-client-generator";

const explorer = cosmiconfig(MODULE_NAME, {
  searchPlaces: [
    `${MODULE_NAME}rc`,
    `${MODULE_NAME}rc.json`,
    `${MODULE_NAME}rc.yaml`,
    `${MODULE_NAME}rc.yml`,
    `${MODULE_NAME}.config.json`,
    `${MODULE_NAME}.config.yaml`,
    `${MODULE_NAME}.config.yml`,
    `${MODULE_NAME}.config.js`,
    `${MODULE_NAME}.config.cjs`,
    "package.json",
  ],
  loaders: {
    ".json": defaultLoaders[".json"],
    ".yaml": defaultLoaders[".yaml"],
    ".yml": defaultLoaders[".yaml"],
    ".js": defaultLoaders[".js"],
    ".cjs": defaultLoaders[".js"],
    noExt: defaultLoaders[".json"],
  },
});

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function mergeConfig(
  baseConfig: Record<string, unknown>,
  overrides: ConfigOverrides | undefined
): Record<string, unknown> {
  if (!overrides) {
    return baseConfig;
  }

  const merged: Record<string, unknown> = { ...baseConfig };

  if (overrides.templateVariables) {
    const existing =
      (isPlainObject(baseConfig.templateVariables)
        ? (baseConfig.templateVariables as Record<string, string>)
        : {}) ?? {};
    merged.templateVariables = {
      ...existing,
      ...overrides.templateVariables,
    };
  }

  if (overrides.orval) {
    const existingOrval = isPlainObject(baseConfig.orval)
      ? (baseConfig.orval as Record<string, unknown>)
      : {};
    merged.orval = {
      ...existingOrval,
      ...objectWithoutUndefined(overrides.orval),
    };
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    if (key === "templateVariables" || key === "orval") continue;
    merged[key] = value;
  }

  return merged;
}

function sanitizePackageName(name: string, fallback: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return fallback;
  }

  let scope: string | null = null;
  let simpleName = trimmed;
  if (trimmed.startsWith("@")) {
    const parts = trimmed.slice(1).split("/");
    scope = parts.shift() ?? "";
    simpleName = parts.join("/");
  }

  const normalizeSegment = (segment: string) =>
    segment
      .toLowerCase()
      .replace(/[^a-z0-9-_.]/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

  const normalizedScope = scope ? normalizeSegment(scope) : null;
  let normalizedName = normalizeSegment(simpleName);

  if (!normalizedName) {
    normalizedName = fallback;
  }

  return normalizedScope ? `@${normalizedScope}/${normalizedName}` : normalizedName;
}

function toCamelCase(value: string): string {
  return value
    .replace(/[_\s-]+(.)?/g, (_, c: string) => (c ? c.toUpperCase() : ""))
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function toPascalCase(value: string): string {
  const camel = toCamelCase(value);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function objectWithoutUndefined<T extends Record<string, unknown>>(input: T): T {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

export async function loadGeneratorConfig(
  options: LoadOptions
): Promise<ResolvedGeneratorConfig> {
  const { configPath, workingDirectory, logger, overrides } = options;

  const resolvedConfigPath = configPath
    ? resolvePath(workingDirectory, configPath)
    : undefined;

  const result = resolvedConfigPath
    ? await explorer.load(resolvedConfigPath)
    : await explorer.search(workingDirectory);

  let baseConfig: Record<string, unknown> = {};

  if (result && !result.isEmpty) {
    logger.debug(`Loaded configuration from ${result.filepath}`);
    baseConfig = isPlainObject(result.config) ? (result.config as Record<string, unknown>) : {};
  } else if (resolvedConfigPath) {
    throw new Error(`Unable to locate configuration at "${configPath}".`);
  } else {
    logger.debug("No configuration file found. Using CLI flags only.");
  }

  const mergedConfig = mergeConfig(baseConfig, overrides);

  let parsed: GeneratorConfig;
  try {
    parsed = GeneratorConfigSchema.parse(mergedConfig);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Configuration is invalid: ${formatZodError(error)}`);
    }
    throw error;
  }

  const configDir = result?.filepath ? dirname(result.filepath) : workingDirectory;

  const resolvedTargetDirectory = isAbsolute(parsed.targetDirectory)
    ? parsed.targetDirectory
    : resolvePath(configDir, parsed.targetDirectory);

  const swaggerIsRemote = isHttpUrl(parsed.swaggerPath);
  const resolvedSwaggerPath = swaggerIsRemote
    ? parsed.swaggerPath
    : isAbsolute(parsed.swaggerPath)
      ? parsed.swaggerPath
      : resolvePath(configDir, parsed.swaggerPath);

  if (swaggerIsRemote && parsed.copySwagger) {
    logger.warn(
      "copySwagger is enabled but swaggerPath is a remote URL. Skipping copy and referencing the remote document."
    );
  }

  const fallbackProjectName =
    resolvedTargetDirectory.split(/[\\/]/).filter(Boolean).pop() ?? "client-api";
  const projectName =
    parsed.projectName && parsed.projectName.trim().length > 0
      ? parsed.projectName.trim()
      : fallbackProjectName;

  const fallbackPackageName = sanitizePackageName(fallbackProjectName, "client-api");
  const packageName = sanitizePackageName(projectName, fallbackPackageName);
  const unscopedName = packageName.startsWith("@")
    ? packageName.split("/").slice(1).join("/")
    : packageName;

  const templateVariables = {
    PACKAGE_NAME: packageName,
    PACKAGE_NAME_RAW: projectName,
    PACKAGE_NAME_UNSCOPED: unscopedName,
    PACKAGE_NAME_CAMEL: toCamelCase(unscopedName),
    PACKAGE_NAME_PASCAL: toPascalCase(unscopedName),
    TARGET_DIRECTORY: resolvedTargetDirectory,
    ...parsed.templateVariables,
  };

  const effectiveCopySwagger = parsed.copySwagger && !swaggerIsRemote;
  const swaggerCopyPath = resolvePath(resolvedTargetDirectory, parsed.swaggerCopyTarget);

  const orvalConfigAbsolute = resolvePath(resolvedTargetDirectory, parsed.orval.configPath);
  const orvalWorkspaceAbsolute = resolvePath(
    resolvedTargetDirectory,
    parsed.orval.workspace
  );
  const orvalTargetAbsolute = resolvePath(orvalWorkspaceAbsolute, parsed.orval.targetFile);

  return {
    ...parsed,
    templateVariables,
    copySwagger: effectiveCopySwagger,
    projectName,
    targetDirectory: resolvedTargetDirectory,
    swaggerPath: resolvedSwaggerPath,
    swaggerIsRemote,
    swaggerCopyPath,
    packageName,
    configDir,
    configPath: result?.filepath,
    orval: {
      ...parsed.orval,
      configAbsolute: orvalConfigAbsolute,
      workspaceAbsolute: orvalWorkspaceAbsolute,
      targetFileAbsolute: orvalTargetAbsolute,
    },
  };
}
