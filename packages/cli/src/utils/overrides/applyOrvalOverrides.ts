import type { OrvalClientConfig } from "src/build/buildOrvalConfig";
import { normaliseMockValue } from "src/utils/normaliseMockValue";
import { TemplateOverrides } from "src/types";

export function applyOrvalOverrides(
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
