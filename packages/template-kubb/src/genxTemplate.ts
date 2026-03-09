import { join } from "node:path";
import merge from "merge-deep";
import { generateClients } from "./generator.js";
import {
  type ClientConfig,
  type MultiClientConfig,
  MultiClientConfigSchema,
  type ProjectConfig
} from "./types.js";

type PackageManager = MultiClientConfig["project"]["packageManager"];

type UnifiedTemplateOptionsInput = {
  readonly path?: string;
  readonly installDependencies?: boolean;
  readonly variables?: Record<string, string>;
};

type UnifiedPluginBlock = {
  readonly client?: Record<string, unknown>;
  readonly ts?: Record<string, unknown>;
  readonly oas?: Record<string, unknown>;
};

type UnifiedClientOptionsInput = {
  readonly httpClient?: "axios" | "fetch";
  readonly baseUrl?: string;
  readonly client?: string;
  readonly mode?: string;
  readonly mock?: unknown;
  readonly prettier?: boolean;
  readonly clean?: boolean;
  readonly plugins?: UnifiedPluginBlock;
  readonly kubb?: UnifiedPluginBlock;
  readonly [key: string]: unknown;
};

type UnifiedClientOutputInput = {
  readonly workspace?: string;
  readonly target?: string;
  readonly schemas?: string;
};

type UnifiedClientInput = {
  readonly name: string;
  readonly swagger?: string;
  readonly contract?: ClientConfig["contract"];
  readonly output?: UnifiedClientOutputInput;
  readonly config?: UnifiedClientOptionsInput;
};

type UnifiedConfigInput = {
  readonly project: {
    readonly name: string;
    readonly directory: string;
    readonly packageManager: PackageManager;
    readonly runGenerate?: boolean;
    readonly templateOptions?: UnifiedTemplateOptionsInput;
    readonly output?: string;
    readonly config?: UnifiedClientOptionsInput;
    readonly repository?: ProjectConfig["repository"];
    readonly publish?: ProjectConfig["publish"];
    readonly readme?: ProjectConfig["readme"];
  };
  readonly clients: readonly UnifiedClientInput[];
  readonly hooks?: MultiClientConfig["hooks"];
};

type PlannedDependency = {
  readonly name: string;
  readonly section: "dependencies" | "devDependencies" | "peerDependencies" | "optionalDependencies";
  readonly reason: string;
};

const KUBB_BUILD_DEPENDENCIES = [
  "@kubb/cli",
  "@kubb/core",
  "@kubb/plugin-client",
  "@kubb/plugin-oas",
  "@kubb/plugin-ts",
  "@rollup/plugin-typescript",
  "@types/node",
  "rimraf",
  "rollup",
  "rollup-plugin-delete",
  "rollup-plugin-dts",
  "tslib",
  "typescript",
  "vitest"
] as const;

const capabilityManifest = {
  summary:
    "The Kubb template owns Kubb plugin composition and plugin-specific config richness while GenX API core owns orchestration, lifecycle, and shared contract workflows.",
  capabilities: [
    {
      key: "contracts",
      label: "Contract boundary",
      description:
        "Consumes `swagger` or `contract.source` inputs and preserves GenX API's contract snapshot/checksum workflow.",
      classification: "universal",
      configPaths: ["clients[].swagger", "clients[].contract"]
    },
    {
      key: "output-layout",
      label: "Output layout",
      description:
        "Resolves workspace, target, and schema paths for each generated client package surface.",
      classification: "universal",
      configPaths: ["project.output", "clients[].output"]
    },
    {
      key: "http-client",
      label: "HTTP transport",
      description: "Maps shared transport and base URL intent into `@kubb/plugin-client`.",
      classification: "universal",
      configPaths: [
        "project.config.httpClient",
        "clients[].config.httpClient",
        "project.config.baseUrl",
        "clients[].config.baseUrl"
      ]
    },
    {
      key: "kubb-plugin-client",
      label: "Kubb client plugin",
      description: "Owns first-class `plugin-client` behaviour such as return types and parser strategy.",
      classification: "template-first-class",
      configPaths: [
        "project.config.plugins.client",
        "clients[].config.plugins.client",
        "project.config.kubb.client",
        "clients[].config.kubb.client"
      ]
    },
    {
      key: "kubb-plugin-ts",
      label: "Kubb TypeScript plugin",
      description: "Owns TypeScript schema emission behaviour such as enum style and syntax type.",
      classification: "template-first-class",
      configPaths: [
        "project.config.plugins.ts",
        "clients[].config.plugins.ts",
        "project.config.kubb.ts",
        "clients[].config.kubb.ts"
      ]
    },
    {
      key: "kubb-plugin-oas",
      label: "Kubb OpenAPI plugin",
      description: "Owns OpenAPI parsing and validation behaviour exposed by `plugin-oas`.",
      classification: "template-first-class",
      configPaths: [
        "project.config.plugins.oas",
        "clients[].config.plugins.oas",
        "project.config.kubb.oas",
        "clients[].config.kubb.oas"
      ]
    },
    {
      key: "kubb-pass-through",
      label: "Kubb plugin pass-through",
      description: "Allows raw plugin options to flow directly into generated `kubb.config.ts`.",
      classification: "escape-hatch",
      configPaths: ["project.config.plugins", "clients[].config.plugins", "project.config.kubb", "clients[].config.kubb"]
    },
    {
      key: "template-variables",
      label: "Template variables",
      description: "Injects template-local placeholder values into scaffold files.",
      classification: "escape-hatch",
      configPaths: ["project.templateOptions.variables"]
    },
    {
      key: "template-path",
      label: "Local scaffold override",
      description: "Replaces the shipped scaffold with a local template path.",
      classification: "escape-hatch",
      configPaths: ["project.templateOptions.path"]
    }
  ]
} as const;

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
  clientOutput: UnifiedClientOutputInput | undefined,
  clientName: string
) {
  const output = clientOutput ?? {};
  const workspace = output.workspace ?? resolveWorkspace(projectOutput, clientName);
  const target = output.target ?? join(workspace, "client.ts");
  const schemas = output.schemas ?? join(workspace, "model");
  return { workspace, target, schemas };
}

function createTemplateOptions(templatePackage: string, options: UnifiedTemplateOptionsInput | undefined) {
  const variables = options?.variables ?? {};
  return cleanUndefined({
    name: templatePackage,
    installDependencies: options?.installDependencies ?? true,
    path: options?.path,
    variables
  });
}

function assertNoOrvalOnlyOptions(unified: UnifiedConfigInput) {
  const issues: string[] = [];

  const checkScope = (scope: UnifiedClientOptionsInput | undefined, path: string) => {
    if (!scope) {
      return;
    }
    if (scope.client !== undefined) {
      issues.push(`${path}.client belongs to the Orval template capability surface.`);
    }
    if (scope.mode !== undefined) {
      issues.push(`${path}.mode belongs to the Orval template capability surface.`);
    }
    if (scope.mock !== undefined) {
      issues.push(`${path}.mock belongs to the Orval template capability surface.`);
    }
    if (scope.prettier !== undefined) {
      issues.push(`${path}.prettier belongs to the Orval template capability surface.`);
    }
    if (scope.clean !== undefined) {
      issues.push(`${path}.clean belongs to the Orval template capability surface.`);
    }
  };

  checkScope(unified.project.config, "project.config");
  unified.clients.forEach((client, index) => {
    checkScope(client.config, `clients[${index}].config`);
  });

  if (issues.length > 0) {
    throw new Error(
      [
        "The Kubb template received Orval-specific configuration.",
        ...issues.map((issue) => `- ${issue}`),
        "Move those settings to the Orval template or keep them inside an Orval-specific config."
      ].join("\n")
    );
  }
}

function createDependencyCollector() {
  const dependencies = new Map<string, PlannedDependency>();

  return {
    add(name: string, section: PlannedDependency["section"], reason: string) {
      dependencies.set(`${section}:${name}`, {
        name,
        section,
        reason
      });
    },
    list() {
      return Array.from(dependencies.values()).sort((a, b) => {
        if (a.section === b.section) {
          return a.name.localeCompare(b.name);
        }
        return a.section.localeCompare(b.section);
      });
    }
  };
}

function createDocumentationCollector() {
  const hints = new Map<string, { readonly title: string; readonly body: string }>();

  return {
    add(title: string, body: string) {
      hints.set(title, { title, body });
    },
    list() {
      return Array.from(hints.values());
    }
  };
}

function createSelectedCapabilityCollector() {
  const keys = new Set<string>();

  return {
    add(key: string) {
      keys.add(key);
    },
    list() {
      return Array.from(keys).sort();
    }
  };
}

function buildGenerationPlan(config: MultiClientConfig) {
  const dependencies = createDependencyCollector();
  const selectedCapabilities = createSelectedCapabilityCollector();
  const documentationHints = createDocumentationCollector();

  selectedCapabilities.add("contracts");
  selectedCapabilities.add("output-layout");
  selectedCapabilities.add("kubb-plugin-client");
  selectedCapabilities.add("kubb-plugin-ts");
  selectedCapabilities.add("kubb-plugin-oas");
  selectedCapabilities.add("kubb-pass-through");

  documentationHints.add(
    "Capability ownership",
    "GenX API core owns contract resolution, lifecycle, and manifest writing. Kubb-specific plugin composition stays inside the template and is materialized in `kubb.config.ts`."
  );

  for (const dependency of KUBB_BUILD_DEPENDENCIES) {
    dependencies.add(dependency, "devDependencies", "Required to generate, build, and test the Kubb-based package.");
  }

  if (config.project.template.path) {
    selectedCapabilities.add("template-path");
  }
  if (Object.keys(config.project.template.variables ?? {}).length > 0) {
    selectedCapabilities.add("template-variables");
  }

  for (const client of config.clients) {
    if (client.kubb.client.baseURL || client.kubb.client.client) {
      selectedCapabilities.add("http-client");
    }

    if (client.kubb.client.client === "axios") {
      dependencies.add("axios", "devDependencies", "Selected Kubb client transport depends on axios during build.");
    }

    if (client.kubb.client.parser === "zod") {
      dependencies.add("zod", "devDependencies", "Selected Kubb parser emits Zod-backed client helpers.");
    }
  }

  return {
    selectedCapabilities: selectedCapabilities.list(),
    dependencies: dependencies.list(),
    documentationHints: documentationHints.list(),
    output: {
      configFiles: ["kubb.config.ts"],
      entrypoints: ["src/index.ts", "dist/index.js", "dist/index.d.ts"],
      notes: [
        "The generated package boundary stays at `src/index.ts` / `dist/index.js`.",
        "Kubb-native richness stays in `kubb.config.ts` and plugin configuration blocks."
      ]
    }
  };
}

function transformUnifiedConfig(
  unified: UnifiedConfigInput,
  context: {
    readonly templateName: string;
  }
): MultiClientConfig {
  assertNoOrvalOnlyOptions(unified);

  const projectOptions = unified.project.config ?? {};
  const projectOutput = unified.project.output;

  const projectConfig = cleanUndefined({
    name: unified.project.name,
    directory: unified.project.directory,
    packageManager: unified.project.packageManager,
    runGenerate: unified.project.runGenerate ?? true,
    template: createTemplateOptions(context.templateName, unified.project.templateOptions),
    repository: unified.project.repository,
    publish: unified.project.publish,
    readme: unified.project.readme
  }) as ProjectConfig;

  const clients = unified.clients.map((client) => {
    const mergedOptions = mergeOptions<UnifiedClientOptionsInput>(
      projectOptions,
      client.config ?? {}
    );
    const pluginDefaults = projectOptions.plugins ?? projectOptions.kubb ?? {};
    const pluginOverrides = client.config?.plugins ?? client.config?.kubb ?? {};
    const outputs = resolveOutputs(projectOutput, client.output, client.name);
    const pluginClient = mergeOptions(
      pluginDefaults.client as Record<string, unknown> | undefined,
      pluginOverrides.client as Record<string, unknown> | undefined
    );

    if (mergedOptions.httpClient && typeof pluginClient === "object") {
      (pluginClient as Record<string, unknown>).client = mergedOptions.httpClient;
    }
    if (mergedOptions.baseUrl && typeof pluginClient === "object") {
      (pluginClient as Record<string, unknown>).baseURL = mergedOptions.baseUrl;
    }

    return {
      name: client.name,
      swagger: client.contract?.source ?? client.swagger,
      contract: client.contract,
      output: outputs,
      kubb: cleanUndefined({
        client: cleanUndefined(pluginClient ?? {}),
        ts: cleanUndefined(
          mergeOptions(
            pluginDefaults.ts as Record<string, unknown> | undefined,
            pluginOverrides.ts as Record<string, unknown> | undefined
          ) ?? {}
        ),
        oas: cleanUndefined(
          mergeOptions(
            pluginDefaults.oas as Record<string, unknown> | undefined,
            pluginOverrides.oas as Record<string, unknown> | undefined
          ) ?? {}
        )
      })
    } as ClientConfig;
  });

  return {
    project: projectConfig,
    clients,
    hooks: unified.hooks ?? { beforeGenerate: [], afterGenerate: [] }
  };
}

export const genxTemplate = {
  id: "kubb",
  name: "@genxapi/template-kubb",
  displayName: "Kubb API Client Template",
  aliases: ["kubb"],
  schema: MultiClientConfigSchema,
  capabilityManifest,
  transformUnifiedConfig,
  planGeneration: buildGenerationPlan,
  generateClients,
  validateConfig(config: MultiClientConfig) {
    MultiClientConfigSchema.parse(config);
  }
};
