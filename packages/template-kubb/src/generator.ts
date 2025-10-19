import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, relative as relativePath, resolve } from "pathe";
import fs from "fs-extra";
import { execa } from "execa";
import merge from "merge-deep";
import { globby } from "globby";
import YAML from "yaml";
import type {
  ClientConfig,
  MultiClientConfig,
  GenerateClientsOptions
} from "./types.js";

interface SwaggerInfo {
  readonly title?: string;
  readonly description?: string;
  readonly version?: string;
  readonly source: string;
}

const TEMPLATE_ROOT = fileURLToPath(new URL("./template", import.meta.url));
const TEXT_EXTENSIONS = new Set([
  ".json",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".txt",
  ".yaml",
  ".yml",
  ".tsconfig"
]);

export async function generateClients(
  config: MultiClientConfig,
  options: GenerateClientsOptions = {}
): Promise<void> {
  const logger = options.logger ?? console;
  const projectDir = resolve(options.configDir ?? process.cwd(), config.project.directory);
  const templateDir = config.project.template.path
    ? resolve(options.configDir ?? process.cwd(), config.project.template.path)
    : TEMPLATE_ROOT;

  logger.info(`Scaffolding project into ${projectDir}`);
  await fs.ensureDir(projectDir);
  await fs.copy(templateDir, projectDir, {
    overwrite: true,
    dereference: true
  });

  await applyPackageJson(projectDir, config);
  await applyTemplateVariables(projectDir, config);
  await ensureClientWorkspaces(projectDir, config.clients);
  const { targets: swaggerTargets, infos: swaggerInfos } = await handleSwaggerDocuments(
    projectDir,
    config,
    options,
    logger
  );
  await writeKubbConfig(projectDir, config, swaggerTargets);
  await generateReadme(projectDir, config, swaggerInfos);

  if (config.project.template.installDependencies) {
    await installDependencies(projectDir, config.project.packageManager, logger);
  }

  if (config.hooks.beforeGenerate.length > 0) {
    await runHooks(config.hooks.beforeGenerate, projectDir, logger);
  }

  if (options.runKubb ?? config.project.runGenerate) {
    await runKubb(projectDir, config.project.packageManager, logger);
  }

  if (config.hooks.afterGenerate.length > 0) {
    await runHooks(config.hooks.afterGenerate, projectDir, logger);
  }
}

async function applyPackageJson(projectDir: string, config: MultiClientConfig) {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) {
    return;
  }
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  pkg.name = config.project.name;
  pkg.scripts = pkg.scripts ?? {};
  pkg.scripts["generate-clients"] = "kubb generate --config kubb.config.ts";
  pkg.scripts["npm-publish"] = pkg.scripts["npm-publish"] ?? "npm publish";
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function applyTemplateVariables(projectDir: string, config: MultiClientConfig) {
  const replacements = new Map<string, string>([
    ["__PROJECT_NAME__", config.project.name]
  ]);

  for (const [key, value] of Object.entries(config.project.template.variables ?? {})) {
    replacements.set(`__${key.toUpperCase()}__`, value);
  }

  const files = await globby(["**/*"], {
    cwd: projectDir,
    dot: true,
    onlyFiles: true
  });

  await Promise.all(
    files.map(async (file) => {
      const fullPath = join(projectDir, file);
      const extension = extname(file);
      if (extension && !TEXT_EXTENSIONS.has(extension)) {
        return;
      }
      const data = await readFile(fullPath, "utf8").catch(() => null);
      if (!data) return;
      let updated = data;
      for (const [token, value] of replacements) {
        updated = updated.replaceAll(token, value);
      }
      if (updated !== data) {
        await writeFile(fullPath, updated);
      }
    })
  );
}

async function ensureClientWorkspaces(projectDir: string, clients: ClientConfig[]) {
  for (const client of clients) {
    const workspaceDir = resolve(projectDir, client.output.workspace);
    await fs.ensureDir(workspaceDir);
    const targetDir = resolve(projectDir, dirname(client.output.target));
    await fs.ensureDir(targetDir);
  }
}

async function handleSwaggerDocuments(
  projectDir: string,
  config: MultiClientConfig,
  options: GenerateClientsOptions,
  logger: GenerateClientsOptions["logger"]
): Promise<{ targets: Record<string, string>; infos: Record<string, SwaggerInfo | null> }> {
  const targets: Record<string, string> = {};
  const infos: Record<string, SwaggerInfo | null> = {};

  for (const client of config.clients) {
    const sourceAbsolute = resolve(options.configDir ?? process.cwd(), client.swagger);
    if (client.copySwagger && !isHttp(client.swagger)) {
      const destination = resolve(projectDir, client.swaggerCopyTarget);
      logger?.info?.(`Copying ${client.swagger} -> ${client.swaggerCopyTarget}`);
      await fs.ensureDir(resolve(destination, ".."));
      await fs.copyFile(sourceAbsolute, destination);
      targets[client.name] = client.swaggerCopyTarget;
      infos[client.name] = await readSwaggerInfoFromFile(destination, client.swagger);
    } else if (!client.copySwagger && !isHttp(client.swagger)) {
      targets[client.name] = toProjectRelative(projectDir, sourceAbsolute, client.swagger);
      infos[client.name] = await readSwaggerInfoFromFile(sourceAbsolute, client.swagger);
    } else {
      targets[client.name] = client.swagger;
      infos[client.name] = await readSwaggerInfoFromRemote(client.swagger);
    }
  }

  return { targets, infos };
}

function isHttp(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function toProjectRelative(projectDir: string, absolute: string, original: string): string {
  if (isHttp(original)) {
    return original;
  }
  const relative = relativePath(projectDir, absolute);
  return relative === "" ? original : ensureRelativePath(relative.replace(/\\/g, "/"));
}

async function writeKubbConfig(
  projectDir: string,
  config: MultiClientConfig,
  swaggerTargets: Record<string, string>
) {
  const clientBlocks: string[] = [];

  for (const client of config.clients) {
    const workspace = ensureRelativePath(client.output.workspace);
    const schemasPath = joinRelative(workspace, client.output.schemas ?? "model");
    const clientTarget = ensureRelativePath(client.output.target);
    const swaggerPath = swaggerTargets[client.name];
    const oasOutput = joinRelative(workspace, "oas");

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

async function generateReadme(
  projectDir: string,
  config: MultiClientConfig,
  swaggerInfos: Record<string, SwaggerInfo | null>
): Promise<void> {
  const readmeConfig = config.project.readme;
  const lines: string[] = [];
  const projectName = config.project.name;
  lines.push(`# ${projectName}`);
  lines.push("");

  const intro = readmeConfig?.introduction
    ? readmeConfig.introduction
    : `This package contains generated API clients produced by \`@genxapi/cli\` using the Kubb toolchain.`;
  lines.push(intro);
  lines.push("");

  lines.push("## Clients");
  lines.push("");
  lines.push("| Client | OpenAPI Source | Base URL | Description |");
  lines.push("| ------ | -------------- | -------- | ----------- |");
  for (const client of config.clients) {
    const info = swaggerInfos[client.name];
    const swaggerLabel = info?.title ?? client.swagger;
    const swaggerLink = `[${swaggerLabel}](${info?.source ?? client.swagger})`;
    const baseUrl = client.kubb.client.baseURL ?? "—";
    const description = info?.description ? info.description.replace(/\n+/g, " ") : "—";
    lines.push(`| ${client.name} | ${swaggerLink} | ${baseUrl} | ${description} |`);
  }
  lines.push("");

  const usageLines: string[] = [];
  if (readmeConfig?.usage) {
    usageLines.push(readmeConfig.usage);
  } else {
    usageLines.push("Install dependencies and regenerate clients:");
    usageLines.push("");
    usageLines.push("```bash");
    usageLines.push("npm install");
    usageLines.push("npm run generate-clients");
    usageLines.push("```");
    usageLines.push("");
    usageLines.push("The generated Kubb configuration is available at `kubb.config.ts`.");
  }
  lines.push("## Usage");
  lines.push("");
  lines.push(...usageLines);
  lines.push("");

  if (readmeConfig?.additionalSections) {
    for (const section of readmeConfig.additionalSections) {
      lines.push(`## ${section.title}`);
      lines.push("");
      lines.push(section.body);
      lines.push("");
    }
  }

  await writeFile(join(projectDir, "README.md"), `${lines.join("\n")}\n`);
}

async function readSwaggerInfoFromFile(path: string, source: string): Promise<SwaggerInfo | null> {
  try {
    const content = await fs.readFile(path, "utf8");
    const parsed = parseSwaggerSpec(content);
    if (!parsed) return { source };
    return { ...parsed, source };
  } catch {
    return { source };
  }
}

async function readSwaggerInfoFromRemote(url: string): Promise<SwaggerInfo | null> {
  if (typeof fetch !== "function") {
    return { source: url };
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { source: url };
    }
    const text = await response.text();
    const parsed = parseSwaggerSpec(text);
    if (!parsed) return { source: url };
    return { ...parsed, source: url };
  } catch {
    return { source: url };
  }
}

function parseSwaggerSpec(text: string): Omit<SwaggerInfo, "source"> | null {
  try {
    const asJson = JSON.parse(text);
    if (typeof asJson === "object" && asJson !== null) {
      const info = (asJson as { info?: Record<string, unknown> }).info ?? {};
      return {
        title: typeof info.title === "string" ? info.title : undefined,
        description: typeof info.description === "string" ? info.description : undefined,
        version: typeof info.version === "string" ? info.version : undefined
      };
    }
  } catch {
    try {
      const asYaml = YAML.parse(text);
      if (typeof asYaml === "object" && asYaml !== null) {
        const info = (asYaml as { info?: Record<string, unknown> }).info ?? {};
        return {
          title: typeof info.title === "string" ? info.title : undefined,
          description: typeof info.description === "string" ? info.description : undefined,
          version: typeof info.version === "string" ? info.version : undefined
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}

async function runKubb(projectDir: string, packageManager: string, logger: GenerateClientsOptions["logger"]) {
  logger?.info?.("Running kubb ...");
  const args = ["generate", "--config", "kubb.config.ts"];
  switch (packageManager) {
    case "pnpm":
      await execa("pnpm", ["dlx", "@kubb/cli", ...args], { cwd: projectDir, stdio: "inherit" });
      return;
    case "yarn":
      await execa("yarn", ["dlx", "@kubb/cli", ...args], { cwd: projectDir, stdio: "inherit" });
      return;
    case "bun":
      await execa("bun", ["x", "@kubb/cli", ...args], { cwd: projectDir, stdio: "inherit" });
      return;
    default:
      await execa("npx", ["--yes", "@kubb/cli", ...args], { cwd: projectDir, stdio: "inherit" });
      return;
  }
}

async function runHooks(hooks: string[], projectDir: string, logger: GenerateClientsOptions["logger"]) {
  for (const command of hooks) {
    logger?.info?.(`Running hook: ${command}`);
    await execa(command, {
      cwd: projectDir,
      shell: true,
      stdio: "inherit"
    });
  }
}

async function installDependencies(projectDir: string, packageManager: string, logger: GenerateClientsOptions["logger"]) {
  if (!existsSync(join(projectDir, "package.json"))) {
    return;
  }
  logger?.info?.(`Installing dependencies with ${packageManager}`);
  switch (packageManager) {
    case "pnpm":
      await execa("pnpm", ["install"], { cwd: projectDir, stdio: "inherit" });
      return;
    case "yarn":
      await execa("yarn", ["install"], { cwd: projectDir, stdio: "inherit" });
      return;
    case "bun":
      await execa("bun", ["install"], { cwd: projectDir, stdio: "inherit" });
      return;
    default:
      await execa("npm", ["install"], { cwd: projectDir, stdio: "inherit" });
      return;
  }
}

function ensureRelativePath(value: string): string {
  const normalised = value.replace(/\\/g, "/");
  if (
    normalised.startsWith("./") ||
    normalised.startsWith("../") ||
    normalised.startsWith("/") ||
    normalised.startsWith("file:")
  ) {
    return normalised;
  }
  return `./${normalised}`;
}

function joinRelative(base: string, segment: string): string {
  const trimmedBase = ensureRelativePath(base).replace(/\/+$/, "");
  const trimmedSegment = segment.replace(/\\/g, "/").replace(/^(\.\/)+/, "").replace(/^\/+/, "");
  if (!trimmedSegment) {
    return trimmedBase;
  }
  return ensureRelativePath(`${trimmedBase}/${trimmedSegment}`);
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
