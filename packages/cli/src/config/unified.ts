import { CliConfig } from "./loader";
import { buildOrvalConfig, OrvalMultiClientConfig } from "src/build/buildOrvalConfig";
import { cleanUndefined } from "src/utils/cleanUndefined";
import { buildKubbConfig, KubbMultiClientConfig } from "src/build/buildKubbConfig";
import { TemplateOverrides, UnifiedGeneratorConfig } from "src/types/types";

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

export function applyTemplateOverrides(
  inputConfig: CliConfig,
  templateKind: "orval" | "kubb",
  overrides: TemplateOverrides | undefined
) {
  if (!overrides) {
    return;
  }

  const project = inputConfig.project;

  if (overrides.packageManager) {
    project.packageManager = overrides.packageManager;
  }

  if (overrides.publish?.npm) {
    const publish = (project.publish as Record<string, unknown> | undefined) ?? {};
    const npmConfig = {
      ...(publish.npm as Record<string, unknown> | undefined)
    };
    const npmOverride = overrides.publish.npm;

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
    project.publish = publish;
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
