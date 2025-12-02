import { writeFile } from "node:fs/promises";
import { join, relative as relativePath } from "node:path";
import merge from "merge-deep";
import type { MultiClientConfig } from "../types.js";

export async function writeOrvalConfig(
  projectDir: string,
  config: MultiClientConfig,
  swaggerTargets: Record<string, string>
) {
  const baseConfig = config.clients.reduce<Record<string, unknown>>((acc, client) => {
    const name = client.name;
    const swaggerTarget = swaggerTargets[name];
    const workspace = client.output.workspace;
    const targetRelative = relativePath(workspace, client.output.target);
    const schemasRelative = relativePath(workspace, client.output.schemas);

    acc[name] = buildClientConfig({
      swaggerTarget,
      client,
      target: targetRelative,
      clientKind: client.orval.client,
      clean: client.orval.clean,
      schemas: schemasRelative
    });
    return acc;
  }, {});

  const merged = merge({} as Record<string, unknown>, baseConfig);
  const source = `import { defineConfig } from "orval";

export default defineConfig(${JSON.stringify(merged, null, 2)});
`;
  await writeFile(join(projectDir, "orval.config.ts"), source);
}

function buildClientConfig({
  swaggerTarget,
  client,
  target,
  clientKind,
  clean,
  schemas
}: {
  swaggerTarget: string;
  client: MultiClientConfig["clients"][number];
  target: string;
  clientKind: string | undefined;
  clean: boolean | undefined;
  schemas: string;
}) {
  return {
    input: {
      target: swaggerTarget
    },
    output: {
      target,
      workspace: client.output.workspace,
      schemas,
      mode: client.orval.mode,
      client: clientKind,
      httpClient: client.orval.httpClient,
      baseUrl: client.orval.baseUrl,
      mock: client.orval.mock,
      prettier: client.orval.prettier,
      clean
    }
  };
}
