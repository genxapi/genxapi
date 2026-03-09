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

type UnifiedClientOptionsInput = {
  readonly httpClient?: "axios" | "fetch";
  readonly client?: string;
  readonly mode?: string;
  readonly baseUrl?: string;
  readonly mock?:
    | boolean
    | {
        readonly type?: string;
        readonly delay?: number;
        readonly useExamples?: boolean;
      };
  readonly prettier?: boolean;
  readonly clean?: boolean;
  readonly plugins?: Record<string, unknown>;
  readonly kubb?: Record<string, unknown>;
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

const ORVAL_BUILD_DEPENDENCIES = [
  "@orval/core",
  "@rollup/plugin-typescript",
  "@types/node",
  "orval",
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
    "The Orval template owns Orval-native client modes, mock generation, and generated package assembly while GenX API core owns orchestration and lifecycle.",
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
      description: "Maps shared transport intent into Orval's HTTP client settings.",
      classification: "universal",
      configPaths: [
        "project.config.httpClient",
        "clients[].config.httpClient",
        "project.config.baseUrl",
        "clients[].config.baseUrl"
      ]
    },
    {
      key: "orval-client",
      label: "Orval client adapter",
      description:
        "Owns Orval's adapter catalogue such as `react-query`, `axios`, `fetch`, and `zod`.",
      classification: "template-first-class",
      configPaths: ["project.config.client", "clients[].config.client"]
    },
    {
      key: "orval-mode",
      label: "Orval output mode",
      description: "Controls Orval's split/tag output strategies.",
      classification: "template-first-class",
      configPaths: ["project.config.mode", "clients[].config.mode"]
    },
    {
      key: "orval-mock",
      label: "Orval mock generation",
      description: "Controls MSW mock generation and mock-specific tuning.",
      classification: "template-first-class",
      configPaths: ["project.config.mock", "clients[].config.mock"]
    },
    {
      key: "orval-formatting",
      label: "Orval formatting and cleanup",
      description: "Controls Orval-managed formatting and cleanup behaviour.",
      classification: "template-first-class",
      configPaths: [
        "project.config.prettier",
        "clients[].config.prettier",
        "project.config.clean",
        "clients[].config.clean"
      ]
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

function normaliseMockValue(
  mockOptions: UnifiedClientOptionsInput["mock"]
): boolean | Record<string, unknown> | undefined {
  if (mockOptions === undefined) {
    return undefined;
  }
  if (mockOptions === false) {
    return false;
  }
  if (mockOptions === true) {
    return { type: "msw" };
  }

  const type = mockOptions.type ?? "msw";
  if (type === "off" || type === "false") {
    return false;
  }

  return cleanUndefined({
    type,
    delay: mockOptions.delay,
    useExamples: mockOptions.useExamples
  });
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

function assertNoKubbOnlyOptions(unified: UnifiedConfigInput) {
  const issues: string[] = [];

  const checkScope = (scope: UnifiedClientOptionsInput | undefined, path: string) => {
    if (!scope) {
      return;
    }
    if (scope.plugins !== undefined) {
      issues.push(`${path}.plugins belongs to the Kubb template capability surface.`);
    }
    if (scope.kubb !== undefined) {
      issues.push(`${path}.kubb belongs to the Kubb template capability surface.`);
    }
  };

  checkScope(unified.project.config, "project.config");
  unified.clients.forEach((client, index) => {
    checkScope(client.config, `clients[${index}].config`);
  });

  if (issues.length > 0) {
    throw new Error(
      [
        "The Orval template received Kubb-specific configuration.",
        ...issues.map((issue) => `- ${issue}`),
        "Move those settings to the Kubb template or keep them inside a Kubb-specific config."
      ].join("\n")
    );
  }
}

function resolveClientKind(client: ClientConfig): string {
  return client.orval.client ?? "react-query";
}

function resolveEffectiveHttpClient(client: ClientConfig): "axios" | "fetch" | undefined {
  const clientKind = resolveClientKind(client);
  if (clientKind === "axios" || clientKind === "axios-functions") {
    return "axios";
  }
  if (clientKind === "fetch") {
    return "fetch";
  }
  if (clientKind === "zod") {
    return undefined;
  }
  return client.orval.httpClient === "fetch" ? "fetch" : "axios";
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
  documentationHints.add(
    "Capability ownership",
    "GenX API core owns contract resolution, lifecycle, and manifest writing. Orval-specific client, mode, and mock behaviour stay inside the template and are materialized in `orval.config.ts`."
  );

  for (const dependency of ORVAL_BUILD_DEPENDENCIES) {
    dependencies.add(dependency, "devDependencies", "Required to generate, build, and test the Orval-based package.");
  }

  if (config.project.template.path) {
    selectedCapabilities.add("template-path");
  }
  if (Object.keys(config.project.template.variables ?? {}).length > 0) {
    selectedCapabilities.add("template-variables");
  }

  const clientKinds = new Set<string>();

  for (const client of config.clients) {
    const clientKind = resolveClientKind(client);
    clientKinds.add(clientKind);
    selectedCapabilities.add("orval-client");
    selectedCapabilities.add("orval-mode");

    if (client.orval.baseUrl) {
      selectedCapabilities.add("http-client");
    }
    if (client.orval.prettier !== undefined || client.orval.clean !== undefined) {
      selectedCapabilities.add("orval-formatting");
    }
    if (client.orval.mock !== false) {
      selectedCapabilities.add("orval-mock");
      dependencies.add("msw", "devDependencies", "Selected Orval mocks generate MSW handlers.");
      dependencies.add(
        "@faker-js/faker",
        "devDependencies",
        "Selected Orval mocks use Faker-backed example generation."
      );
      dependencies.add("msw", "peerDependencies", "Consumers may import generated MSW handlers.");
    }

    const transport = resolveEffectiveHttpClient(client);
    if (transport) {
      selectedCapabilities.add("http-client");
    }
    if (transport === "axios") {
      dependencies.add("axios", "devDependencies", "Selected Orval transport depends on axios at generation/build time.");
      dependencies.add("axios", "peerDependencies", "The generated package exposes axios-backed runtime APIs.");
    }

    if (clientKind === "react-query") {
      dependencies.add("react", "devDependencies", "React Query clients require React during local build/test workflows.");
      dependencies.add(
        "@tanstack/react-query",
        "devDependencies",
        "Selected Orval client emits TanStack React Query hooks."
      );
      dependencies.add("@types/react", "devDependencies", "React Query clients require React type declarations.");
      dependencies.add("react", "peerDependencies", "Consumers import React-backed hooks from the generated package.");
      dependencies.add(
        "@tanstack/react-query",
        "peerDependencies",
        "Consumers import TanStack React Query hooks from the generated package."
      );
    }

    if (clientKind === "zod") {
      dependencies.add("zod", "devDependencies", "Selected Orval client emits Zod schemas.");
      dependencies.add("zod", "peerDependencies", "Consumers may rely on generated Zod schemas.");
    }
  }

  if (clientKinds.has("swr")) {
    dependencies.add("react", "devDependencies", "SWR clients rely on React during local build/test workflows.");
    dependencies.add("@types/react", "devDependencies", "SWR clients require React type declarations.");
    dependencies.add("react", "peerDependencies", "Consumers import React-backed SWR clients.");
    documentationHints.add(
      "Manual dependency follow-up",
      "Selected Orval client `swr` is supported by the template, but the scaffold does not pin the `swr` package yet. Install it in the generated package if you use that adapter."
    );
  }

  if (clientKinds.has("vue-query")) {
    documentationHints.add(
      "Manual dependency follow-up (Vue)",
      "Selected Orval client `vue-query` is supported by the template, but the scaffold does not pin Vue runtime packages yet. Install `vue` and `@tanstack/vue-query` in the generated package when you use that adapter."
    );
  }

  if (clientKinds.has("svelte-query")) {
    documentationHints.add(
      "Manual dependency follow-up (Svelte)",
      "Selected Orval client `svelte-query` is supported by the template, but the scaffold does not pin Svelte runtime packages yet. Install `svelte` and `@tanstack/svelte-query` in the generated package when you use that adapter."
    );
  }

  if (clientKinds.has("angular")) {
    documentationHints.add(
      "Manual dependency follow-up (Angular)",
      "Selected Orval client `angular` is supported by the template, but Angular runtime packages are not auto-pinned yet. Install the Angular packages your generated client expects in the generated package."
    );
  }

  return {
    selectedCapabilities: selectedCapabilities.list(),
    dependencies: dependencies.list(),
    documentationHints: documentationHints.list(),
    output: {
      configFiles: ["orval.config.ts"],
      entrypoints: ["src/index.ts", "dist/index.js", "dist/index.d.ts"],
      notes: [
        "The generated package boundary stays at `src/index.ts` / `dist/index.js`.",
        "Orval-native richness stays in `orval.config.ts` and generated client workspaces."
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
  assertNoKubbOnlyOptions(unified);

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
    const outputs = resolveOutputs(projectOutput, client.output, client.name);
    const mockValue = normaliseMockValue(mergedOptions.mock);

    return {
      name: client.name,
      swagger: client.contract?.source ?? client.swagger,
      contract: client.contract,
      output: outputs,
      orval: cleanUndefined({
        mode: mergedOptions.mode,
        client: mergedOptions.client,
        httpClient: mergedOptions.httpClient,
        baseUrl: mergedOptions.baseUrl,
        mock: mockValue,
        prettier: mergedOptions.prettier,
        clean: mergedOptions.clean
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
  id: "orval",
  name: "@genxapi/template-orval",
  displayName: "Orval API Client Template",
  aliases: ["orval"],
  schema: MultiClientConfigSchema,
  capabilityManifest,
  transformUnifiedConfig,
  planGeneration: buildGenerationPlan,
  generateClients,
  validateConfig(config: MultiClientConfig) {
    MultiClientConfigSchema.parse(config);
  }
};
