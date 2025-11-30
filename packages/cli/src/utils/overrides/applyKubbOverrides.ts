import type { KubbClientConfig } from "src/build/buildKubbConfig";
import { TemplateOverrides } from "src/types";

export function applyKubbOverrides(
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
