import { join } from "pathe";
import merge from "merge-deep";
import { z } from "zod";
import type {
  ClientConfig as OrvalClientConfig,
  MultiClientConfig as OrvalMultiClientConfig,
  ProjectConfig as OrvalProjectConfig
} from "@genxapi/template-orval";
import type {
  ClientConfig as KubbClientConfig,
  MultiClientConfig as KubbMultiClientConfig,
  ProjectConfig as KubbProjectConfig
} from "@genxapi/template-kubb";

const TemplateIdentifierSchema = z.union([z.literal("orval"), z.literal("kubb"), z.string()]);

const HttpClientSchema = z.enum(["axios", "fetch"]);

const OrvalClientAdapterSchema = z.enum([
  "axios",
  "axios-functions",
  "angular",
  "react-query",
  "swr",
  "vue-query",
  "svelte-query",
  "zod",
  "fetch"
]);

const OrvalModeSchema = z.enum(["single", "split", "tags", "split-tags", "split-tag", "tags-split"]);

const MockOptionsSchema = z
  .object({
    type: z.enum(["msw", "off"]).default("msw"),
    delay: z.number().int().nonnegative().optional(),
    useExamples: z.boolean().optional()
  })
  .partial();

const PluginOptionsSchema = z
  .object({
    client: z.record(z.string(), z.unknown()).optional(),
    ts: z.record(z.string(), z.unknown()).optional(),
    oas: z.record(z.string(), z.unknown()).optional()
  })
  .partial();

export const UnifiedClientOptionsSchema = z
  .object({
    httpClient: HttpClientSchema.optional(),
    client: OrvalClientAdapterSchema.optional(),
    mode: OrvalModeSchema.optional(),
    baseUrl: z.string().optional(),
    mock: MockOptionsSchema.optional(),
    prettier: z.boolean().optional(),
    clean: z.boolean().optional(),
    plugins: PluginOptionsSchema.optional(),
    kubb: PluginOptionsSchema.optional()
  })
  .partial()
  .passthrough();

const UnifiedClientOutputSchema = z
  .object({
    workspace: z.string().optional(),
    target: z.string().optional(),
    schemas: z.string().optional()
  })
  .default({});

const UnifiedClientSchema = z
  .object({
    name: z.string().min(1),
    swagger: z.string().min(1),
    output: UnifiedClientOutputSchema.optional(),
    config: UnifiedClientOptionsSchema.optional(),
    template: TemplateIdentifierSchema.optional()
  })
  .passthrough();

const TemplateOptionsSchema = z
  .object({
    variables: z.record(z.string(), z.string()).optional(),
    installDependencies: z.boolean().optional(),
    path: z.string().optional()
  })
  .default({});

const UnifiedProjectSchema = z
  .object({
    name: z.string().min(1),
    directory: z.string().min(1).default("./"),
    packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm"),
    template: TemplateIdentifierSchema.default("orval"),
    templateOptions: TemplateOptionsSchema,
    output: z.string().optional(),
    config: UnifiedClientOptionsSchema.default({}),
    repository: z.unknown().optional(),
    publish: z.unknown().optional(),
    readme: z.unknown().optional(),
    runGenerate: z.boolean().optional()
  })
  .passthrough();

const UnifiedHooksSchema = z
  .object({
    beforeGenerate: z.array(z.string()).default([]),
    afterGenerate: z.array(z.string()).default([])
  })
  .default({});

export const UnifiedGeneratorConfigSchema = z
  .object({
    $schema: z.string().optional(),
    logLevel: z.enum(["silent", "error", "warn", "info", "debug"]).optional(),
    project: UnifiedProjectSchema,
    clients: z.array(UnifiedClientSchema).min(1),
    hooks: UnifiedHooksSchema
  })
  .passthrough();

export type UnifiedGeneratorConfig = z.infer<typeof UnifiedGeneratorConfigSchema>;
export type UnifiedClientOptions = z.infer<typeof UnifiedClientOptionsSchema>;

export interface TemplateOverrides {
  readonly httpClient?: string;
  readonly client?: string;
  readonly mode?: string;
  readonly baseUrl?: string;
  readonly prettier?: boolean;
  readonly clean?: boolean;
  readonly mock?: {
    readonly type?: string | null;
    readonly delay?: number | null;
    readonly useExamples?: boolean | null;
    readonly enabled?: boolean;
  };
}

export const TEMPLATE_PACKAGE_MAP: Record<string, string> = {
  orval: "@genxapi/template-orval",
  kubb: "@genxapi/template-kubb"
};

export function resolveTemplatePackage(selector: string): string {
  const normalised = selector.trim().toLowerCase();
  return TEMPLATE_PACKAGE_MAP[normalised] ?? selector;
}

function cleanUndefined<T extends Record<string, unknown>>(value: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result as T;
}

function mergeOptions<T>(...options: Array<T | undefined>): T {
  return merge({}, ...options.filter(Boolean)) as T;
}

function resolveWorkspace(base: string | undefined, clientName: string): string {
  if (!base) {
    return join("./src", clientName);
  }
  return join(base, clientName);
}

function resolveOutputs(
  projectOutput: string | undefined,
  clientOutput: UnifiedClientOutputSchema["_input"],
  clientName: string
) {
  const workspace = clientOutput.workspace ?? resolveWorkspace(projectOutput, clientName);
  const target = clientOutput.target ?? join(workspace, "client.ts");
  const schemas = clientOutput.schemas ?? join(workspace, "model");
  return { workspace, target, schemas };
}

function normaliseMockValue(
  mockOptions: UnifiedClientOptions["mock"],
  overrides?: TemplateOverrides["mock"]
): boolean | Record<string, unknown> | undefined {
  if (!mockOptions && !overrides) {
    return undefined;
  }

  const override = overrides ?? {};
  const hasOverrideDetails =
    override.type !== undefined ||
    override.delay !== undefined ||
    override.useExamples !== undefined ||
    override.enabled !== undefined;

  if (mockOptions === false && !hasOverrideDetails) {
    return false;
  }

  const source =
    typeof mockOptions === "boolean" ? {} : (mockOptions as Record<string, unknown> | undefined) ?? {};

  const type = override.type ?? (source as Record<string, unknown>).type ?? "msw";
  const enabled =
    override.enabled !== undefined
      ? override.enabled
      : type !== "off" && type !== "false" && mockOptions !== false;

  if (!enabled) {
    return false;
  }

  const merged: Record<string, unknown> = {};
  merged.type = type === "off" || type === "false" ? "msw" : type;
  const delay = override.delay ?? source.delay;
  if (typeof delay === "number") {
    merged.delay = delay;
  }
  const useExamples = override.useExamples ?? source.useExamples;
  if (typeof useExamples === "boolean") {
    merged.useExamples = useExamples;
  }

  return merged;
}

export function transformUnifiedConfig(
  unified: UnifiedGeneratorConfig,
  templatePackage: string
): {
  readonly config: OrvalMultiClientConfig | KubbMultiClientConfig;
  readonly template: "orval" | "kubb";
} {
  if (templatePackage === TEMPLATE_PACKAGE_MAP.orval) {
    return {
      config: buildOrvalConfig(unified, templatePackage),
      template: "orval"
    };
  }
  if (templatePackage === TEMPLATE_PACKAGE_MAP.kubb) {
    return {
      config: buildKubbConfig(unified, templatePackage),
      template: "kubb"
    };
  }

  throw new Error(
    `Unified configuration only supports the built-in templates (${Object.values(
      TEMPLATE_PACKAGE_MAP
    ).join(", ")}). Received: ${templatePackage}.`
  );
}

function buildOrvalConfig(
  unified: UnifiedGeneratorConfig,
  templatePackage: string
): OrvalMultiClientConfig {
  const projectOptions = unified.project.config ?? {};
  const projectOutput = unified.project.output;

  const projectTemplate = createTemplateOptions(
    templatePackage,
    unified.project.templateOptions
  );

  const projectConfig: OrvalProjectConfig = cleanUndefined({
    name: unified.project.name,
    directory: unified.project.directory,
    packageManager: unified.project.packageManager,
    runGenerate: unified.project.runGenerate,
    template: projectTemplate,
    repository: unified.project.repository,
    publish: unified.project.publish,
    readme: unified.project.readme
  });

  const clients: OrvalClientConfig[] = unified.clients.map((client) => {
    const mergedOptions = mergeOptions<UnifiedClientOptions>(
      projectOptions,
      client.config ?? {}
    );
    const outputs = resolveOutputs(projectOutput, client.output ?? {}, client.name);

    const mockValue = normaliseMockValue(mergedOptions.mock);

    const orvalOptions = cleanUndefined({
      mode: mergedOptions.mode,
      client: mergedOptions.client,
      httpClient: mergedOptions.httpClient,
      baseUrl: mergedOptions.baseUrl,
      mock: mockValue,
      prettier: mergedOptions.prettier,
      clean: mergedOptions.clean
    });

    return {
      name: client.name,
      swagger: client.swagger,
      output: outputs,
      orval: orvalOptions
    } as OrvalClientConfig;
  });

  return {
    project: projectConfig,
    clients,
    hooks: unified.hooks ?? { beforeGenerate: [], afterGenerate: [] }
  };
}

function buildKubbConfig(
  unified: UnifiedGeneratorConfig,
  templatePackage: string
): KubbMultiClientConfig {
  const projectOptions = unified.project.config ?? {};
  const projectOutput = unified.project.output;

  const projectTemplate = createTemplateOptions(
    templatePackage,
    unified.project.templateOptions
  );

  const projectConfig: KubbProjectConfig = cleanUndefined({
    name: unified.project.name,
    directory: unified.project.directory,
    packageManager: unified.project.packageManager,
    runGenerate: unified.project.runGenerate,
    template: projectTemplate,
    repository: unified.project.repository,
    publish: unified.project.publish,
    readme: unified.project.readme
  });

  const clients: KubbClientConfig[] = unified.clients.map((client) => {
    const mergedOptions = mergeOptions<UnifiedClientOptions>(
      projectOptions,
      client.config ?? {}
    );
    const pluginDefaults = projectOptions.plugins ?? projectOptions.kubb ?? {};
    const pluginOverrides = client.config?.plugins ?? client.config?.kubb ?? {};
    const outputs = resolveOutputs(projectOutput, client.output ?? {}, client.name);

    const pluginClient = mergeOptions(
      pluginDefaults.client,
      pluginOverrides.client
    );
    if (mergedOptions.httpClient && typeof pluginClient === "object") {
      (pluginClient as Record<string, unknown>).client = mergedOptions.httpClient;
    }
    if (mergedOptions.baseUrl && typeof pluginClient === "object") {
      (pluginClient as Record<string, unknown>).baseURL = mergedOptions.baseUrl;
    }
    const pluginTs = mergeOptions(pluginDefaults.ts, pluginOverrides.ts);
    const pluginOas = mergeOptions(pluginDefaults.oas, pluginOverrides.oas);

    const kubbOptions = cleanUndefined({
      client: pluginClient,
      ts: pluginTs,
      oas: pluginOas
    });

    return {
      name: client.name,
      swagger: client.swagger,
      output: outputs,
      kubb: kubbOptions
    } as KubbClientConfig;
  });

  return {
    project: projectConfig,
    clients,
    hooks: unified.hooks ?? { beforeGenerate: [], afterGenerate: [] }
  };
}

function createTemplateOptions(
  templatePackage: string,
  options: z.infer<typeof TemplateOptionsSchema>
) {
  return cleanUndefined({
    name: templatePackage,
    installDependencies:
      options.installDependencies !== undefined ? options.installDependencies : undefined,
    path: options.path,
    variables: options.variables
  });
}

export function applyTemplateOverrides(
  inputConfig: OrvalMultiClientConfig | KubbMultiClientConfig,
  templateKind: "orval" | "kubb",
  overrides: TemplateOverrides | undefined
) {
  if (!overrides) {
    return;
  }

  if (templateKind === "orval") {
    for (const client of (inputConfig as OrvalMultiClientConfig).clients) {
      const options = client.orval ?? {};
      if (overrides.mode) {
        options.mode = overrides.mode;
      }
      if (overrides.client) {
        options.client = overrides.client;
      }
      if (overrides.httpClient) {
        (options as Record<string, unknown>).httpClient = overrides.httpClient;
      }
      if (overrides.baseUrl) {
        options.baseUrl = overrides.baseUrl;
      }
      if (typeof overrides.prettier === "boolean") {
        options.prettier = overrides.prettier;
      }
      if (typeof overrides.clean === "boolean") {
        options.clean = overrides.clean;
      }
      const mockValue = normaliseMockValue(
        typeof options.mock === "object" ? (options.mock as any) : undefined,
        overrides.mock
      );
      if (mockValue !== undefined) {
        options.mock = mockValue;
      }
      client.orval = options;
    }
    return;
  }

  if (templateKind === "kubb") {
    for (const client of (inputConfig as KubbMultiClientConfig).clients) {
      const options = client.kubb ?? {};
      if (overrides.httpClient) {
        options.client = {
          ...(options.client as Record<string, unknown>),
          client: overrides.httpClient
        };
      }
      if (overrides.baseUrl) {
        options.client = {
          ...(options.client as Record<string, unknown>),
          baseURL: overrides.baseUrl
        };
      }
      client.kubb = options;
    }
  }
}
