import { writeFile } from "node:fs/promises";
import { join, relative as relativePath } from "node:path";
import merge from "merge-deep";
import type { MultiClientConfig } from "../types.js";
import { ensureRelativePath, joinRelative } from "./pathHelpers.js";

export async function writeKubbConfig(
  projectDir: string,
  config: MultiClientConfig,
  swaggerTargets: Record<string, string>
) {
  const clientBlocks: string[] = [];

  for (const client of config.clients) {
    const workspace = ensureRelativePath(client.output.workspace);
    const targetRelative = ensureRelativePath(relativePath(workspace, client.output.target));
    const schemasRelative = ensureRelativePath(
      relativePath(workspace, client.output.schemas ?? "model")
    );
    const schemasPath = schemasRelative;
    const clientTarget = targetRelative;
    const swaggerPath = swaggerTargets[client.name];
    const oasOutput = "oas";

    const defaultOasOptions = {
      output: {
        path: oasOutput,
        clean: true
      },
      validate: true
    };
    const defaultTsOptions = {
      output: {
        path: schemasPath,
        barrelType: "named"
      },
      enumType: "asConst",
      dateType: "date"
    };
    const defaultClientOptions = {
      output: {
        path: clientTarget
      },
      client: "fetch",
      dataReturnType: "data",
      pathParamsType: "object",
      paramsType: "object",
      operations: true
    };

    const oasOptions = cleanUndefined(merge({}, defaultOasOptions, client.kubb.oas));
    const tsOptions = cleanUndefined(merge({}, defaultTsOptions, client.kubb.ts));
    const clientOptions = cleanUndefined(merge({}, defaultClientOptions, client.kubb.client));

    const inputJson = indentMultiline(
      JSON.stringify({ path: swaggerPath }, null, 2),
      "    input: ".length
    );
    const outputJson = indentMultiline(
      JSON.stringify({ path: workspace, clean: true }, null, 2),
      "    output: ".length
    );

    const pluginOasCall = formatPluginCall("pluginOas", oasOptions, 3);
    const pluginTsCall = formatPluginCall("pluginTs", tsOptions, 3);
    const pluginClientCall = formatPluginCall("pluginClient", clientOptions, 3);

    clientBlocks.push(`  {
    name: ${JSON.stringify(client.name)},
    root: ".",
    input: ${inputJson},
    output: ${outputJson},
    plugins: [
${pluginOasCall},
${pluginTsCall},
${pluginClientCall}
    ]
  }`);
  }

  const source = `import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginClient } from "@kubb/plugin-client";

export default defineConfig(() => [
${clientBlocks.join(",\n")}
]);
`;

  await writeFile(join(projectDir, "kubb.config.ts"), source);
}

function indentMultiline(value: string, spaces: number): string {
  const indent = " ".repeat(spaces);
  const lines = value.split("\n");
  return lines
    .map((line, index) => (index === 0 ? line : indent + line))
    .join("\n");
}

function formatPluginCall(name: string, options: Record<string, unknown>, indentLevel: number): string {
  const indent = " ".repeat(indentLevel * 2);
  const keys = Object.keys(options);
  if (keys.length === 0) {
    return `${indent}${name}({})`;
  }
  const jsonLines = JSON.stringify(options, null, 2).split("\n");
  const innerIndent = " ".repeat((indentLevel + 1) * 2);
  const content = jsonLines
    .slice(1, -1)
    .map((line) => `${innerIndent}${line}`)
    .join("\n");
  if (!content) {
    return `${indent}${name}({})`;
  }
  return `${indent}${name}({\n${content}\n${indent}})`;
}

function cleanUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanUndefined(item))
      .filter((item) => item !== undefined) as unknown as T;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = cleanUndefined(val);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result as T;
  }
  return value;
}
