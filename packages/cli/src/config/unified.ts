import { CliConfig } from "./loader";
import {
  buildOrvalConfig,
  type OrvalClientConfig,
  type OrvalMultiClientConfig
} from "src/build/buildOrvalConfig";
import {
  buildKubbConfig,
  type KubbClientConfig,
  type KubbMultiClientConfig
} from "src/build/buildKubbConfig";
import { cleanUndefined } from "src/utils/cleanUndefined";
import { normaliseMockValue } from "src/utils/normaliseMockValue";
import { ClientApiTemplates, TemplateOverrides, UnifiedGeneratorConfig } from "src/types";

export type { TemplateOverrides } from "src/types";

type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U>
    ? Mutable<U>[]
    : T[P] extends Array<infer U>
      ? Mutable<U>[]
      : Mutable<T[P]>;
};

export const TEMPLATE_PACKAGE_MAP: Record<string, string> = {
  orval: "@genxapi/template-orval",
  kubb: "@genxapi/template-kubb"
};

export function resolveTemplatePackage(selector: string): string {
  const normalised = selector.trim().toLowerCase();
  return TEMPLATE_PACKAGE_MAP[normalised] ?? selector;
}

export function transformUnifiedConfig(
  unified: UnifiedGeneratorConfig,
  templatePackage: string
): {
  readonly config: OrvalMultiClientConfig | KubbMultiClientConfig;
  readonly template: ClientApiTemplates;
} {
  if (templatePackage === TEMPLATE_PACKAGE_MAP.orval) {
    return {
      config: buildOrvalConfig(unified, templatePackage),
      template: ClientApiTemplates.Orval
    };
  }
  if (templatePackage === TEMPLATE_PACKAGE_MAP.kubb) {
    return {
      config: buildKubbConfig(unified, templatePackage),
      template: ClientApiTemplates.Kubb
    };
  }

  throw new Error(
    `Unified configuration only supports the built-in templates (${Object.values(
      TEMPLATE_PACKAGE_MAP
    ).join(", ")}). Received: ${templatePackage}.`
  );
}

export function applyTemplateOverrides(
  inputConfig: CliConfig,
  templateKind: ClientApiTemplates | undefined,
  overrides: TemplateOverrides | undefined
): CliConfig {
  const config = structuredClone(inputConfig) as Mutable<CliConfig>;
  if (!overrides) {
    return config;
  }

  const resolvedTemplateKind = templateKind ?? config.project.template;

  applyProjectOverrides(config.project as Mutable<CliConfig["project"]>, overrides);

  if (resolvedTemplateKind === ClientApiTemplates.Orval) {
    const orvalClients = config.clients as OrvalClientConfig[];
    config.clients = applyOrvalOverrides(orvalClients, overrides) as Mutable<CliConfig["clients"]>;
  }

  if (resolvedTemplateKind === ClientApiTemplates.Kubb) {
    const kubbClients = config.clients as KubbClientConfig[];
    config.clients = applyKubbOverrides(kubbClients, overrides) as Mutable<CliConfig["clients"]>;
  }

  return config;
}


function applyProjectOverrides(
  project: Mutable<CliConfig["project"]>,
  overrides: TemplateOverrides
): void {
  if (overrides.packageManager) {
    project.packageManager = overrides.packageManager;
  }

  applyPublishOverrides(project, overrides.publish);
}

function applyPublishOverrides(
  project: Mutable<CliConfig["project"]>,
  publishOverrides: TemplateOverrides["publish"] | undefined
): void {
  if (!publishOverrides?.npm) {
    return;
  }

  const publish: { [key: string]: unknown; npm?: Record<string, unknown> } =
    (project.publish as { [key: string]: unknown; npm?: Record<string, unknown> }) ?? {};
  const npmConfig: Record<string, unknown> = {
    ...(publish.npm as Record<string, unknown> | undefined)
  };
  const npmOverride = publishOverrides.npm;

  if (npmOverride.enabled !== undefined) {
    npmConfig.enabled = npmOverride.enabled;
  }
  if (npmOverride.tag !== undefined) {
    npmConfig.tag = npmOverride.tag;
  }
  if (npmOverride.access !== undefined) {
    npmConfig.access = npmOverride.access;
  }
  if (npmOverride.dryRun !== undefined) {
    npmConfig.dryRun = npmOverride.dryRun;
  }
  if (npmOverride.tokenEnv !== undefined) {
    npmConfig.tokenEnv = npmOverride.tokenEnv;
  }
  if (npmOverride.registry !== undefined) {
    npmConfig.registry = npmOverride.registry;
  }
  if (npmOverride.command !== undefined) {
    npmConfig.command = npmOverride.command;
  }

  publish.npm = cleanUndefined(npmConfig);
  project.publish = publish as Mutable<CliConfig["project"]>["publish"];
}

function applyOrvalOverrides(
  clients: OrvalClientConfig[],
  overrides: TemplateOverrides
): OrvalClientConfig[] {
  return clients.map((client) => {
    const options: Record<string, unknown> = {
      ...(client.orval as Record<string, unknown> | undefined)
    };

    if (overrides.mode) {
      options.mode = overrides.mode;
    }
    if (overrides.client) {
      options.client = overrides.client;
    }
    if (overrides.httpClient) {
      options.httpClient = overrides.httpClient;
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
      typeof options.mock === "object" ? (options.mock as Record<string, unknown>) : undefined,
      overrides.mock
    );
    if (mockValue !== undefined) {
      options.mock = mockValue;
    }

    return {
      ...client,
      orval: options as OrvalClientConfig["orval"]
    } as OrvalClientConfig;
  });
}

function applyKubbOverrides(
  clients: KubbClientConfig[],
  overrides: TemplateOverrides
): KubbClientConfig[] {
  return clients.map((client) => {
    const options: Record<string, unknown> = {
      ...(client.kubb as Record<string, unknown> | undefined)
    };

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

    return {
      ...client,
      kubb: options as KubbClientConfig["kubb"]
    } as KubbClientConfig;
  });
}
