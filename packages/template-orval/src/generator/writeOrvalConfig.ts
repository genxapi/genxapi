import { writeFile } from "node:fs/promises";
import { join } from "pathe";
import merge from "merge-deep";
import type { MultiClientConfig } from "../types.js";

export async function writeOrvalConfig(
  projectDir: string,
  config: MultiClientConfig,
  swaggerTargets: Record<string, string>
) {
  const baseConfig = config.clients.reduce<Record<string, unknown>>((acc, client) => {
    const name = client.name;
    const clientConfig = {
      input: {
        target: swaggerTargets[name]
      },
      output: {
        target: client.output.target,
        workspace: client.output.workspace,
        schemas: client.output.schemas,
        mode: client.orval.mode,
        client: client.orval.client,
        httpClient: client.orval.httpClient,
        baseUrl: client.orval.baseUrl,
        mock: client.orval.mock,
        prettier: client.orval.prettier,
        clean: client.orval.clean
      }
    };
    acc[name] = clientConfig;
    return acc;
  }, {});

  const merged = merge({} as Record<string, unknown>, baseConfig);
  const source = `import { defineConfig } from "orval";

export default defineConfig(${JSON.stringify(merged, null, 2)});
`;
  await writeFile(join(projectDir, "orval.config.ts"), source);
}
