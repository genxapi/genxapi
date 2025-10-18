import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, resolve, relative as relativePath, extname } from "pathe";
import fs from "fs-extra";
import { execa } from "execa";
import merge from "merge-deep";
import { globby } from "globby";
import {
  ClientConfig,
  MultiClientConfig,
  GenerateClientsOptions
} from "./types.js";

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
  const swaggerTargets = await handleSwaggerDocuments(projectDir, config, options, logger);
  await writeOrvalConfig(projectDir, config, swaggerTargets);

  if (config.project.template.installDependencies) {
    await installDependencies(projectDir, config.project.packageManager, logger);
  }

  if (config.hooks.beforeGenerate.length > 0) {
    await runHooks(config.hooks.beforeGenerate, projectDir, logger);
  }

  if (options.runOrval ?? config.project.runGenerate) {
    await runOrval(projectDir, config.project.packageManager, logger);
  }

  if (config.hooks.afterGenerate.length > 0) {
    await runHooks(config.hooks.afterGenerate, projectDir, logger);
  }
}

async function applyPackageJson(projectDir: string, config: MultiClientConfig) {
  const pkgPath = join(projectDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  pkg.name = config.project.name;
  pkg.scripts = pkg.scripts ?? {};
  pkg.scripts["generate-clients"] = "orval --config orval.config.ts";
  pkg.scripts["npm-publish"] = pkg.scripts["npm-publish"] ?? "npm publish --access public";
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
    const targetDir = resolve(projectDir, client.output.target, "..");
    await fs.ensureDir(targetDir);
  }
}

async function handleSwaggerDocuments(
  projectDir: string,
  config: MultiClientConfig,
  options: GenerateClientsOptions,
  logger: GenerateClientsOptions["logger"]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  for (const client of config.clients) {
    const sourceAbsolute = resolve(options.configDir ?? process.cwd(), client.swagger);
    if (client.copySwagger && !isHttp(client.swagger)) {
      const destination = resolve(projectDir, client.swaggerCopyTarget);
      logger?.info?.(`Copying ${client.swagger} -> ${client.swaggerCopyTarget}`);
      await fs.ensureDir(resolve(destination, ".."));
      await fs.copyFile(sourceAbsolute, destination);
      results[client.name] = client.swaggerCopyTarget;
    } else {
      results[client.name] = toProjectRelative(projectDir, sourceAbsolute, client.swagger);
    }
  }
  return results;
}

function isHttp(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function toProjectRelative(projectDir: string, absolute: string, original: string): string {
  if (isHttp(original)) {
    return original;
  }
  const relative = relativePath(projectDir, absolute);
  return relative === "" ? original : relative.replace(/\\/g, "/");
}

async function writeOrvalConfig(
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

async function runOrval(projectDir: string, packageManager: string, logger: GenerateClientsOptions["logger"]) {
  logger?.info?.("Running orval ...");
  const args = ["--config", "orval.config.ts"];
  switch (packageManager) {
    case "pnpm":
      await execa("pnpm", ["dlx", "orval", ...args], { cwd: projectDir, stdio: "inherit" });
      return;
    case "yarn":
      await execa("yarn", ["dlx", "orval", ...args], { cwd: projectDir, stdio: "inherit" });
      return;
    case "bun":
      await execa("bun", ["x", "orval", ...args], { cwd: projectDir, stdio: "inherit" });
      return;
    default:
      await execa("npx", ["--yes", "orval", ...args], { cwd: projectDir, stdio: "inherit" });
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
