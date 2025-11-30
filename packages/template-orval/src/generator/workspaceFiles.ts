import { isAbsolute, join, relative as relativePath, resolve } from "pathe";
import fs from "fs-extra";
import { writeFile } from "node:fs/promises";
import type { ClientConfig } from "../types.js";

export async function ensureClientWorkspaces(projectDir: string, clients: ClientConfig[]) {
  for (const client of clients) {
    const workspaceDir = resolve(projectDir, client.output.workspace);
    await fs.ensureDir(workspaceDir);
    const targetDir = resolveOutputPath(projectDir, client, join(client.output.target, ".."));
    const schemasDir = resolveOutputPath(projectDir, client, client.output.schemas);
    await fs.ensureDir(targetDir);
    await fs.ensureDir(schemasDir);
  }
}

export async function writeRootIndex(projectDir: string, clients: ClientConfig[]) {
  const srcDir = join(projectDir, "src");
  await fs.ensureDir(srcDir);

  const lines: string[] = [];

  for (const client of clients) {
    const namespace = toIdentifier(client.name);
    const importPath = toWorkspaceImportPath(projectDir, client);
    lines.push(`export * as ${namespace} from "${importPath}";`);
  }

  lines.push("");
  await writeFile(join(srcDir, "index.ts"), lines.join("\n"));
}

function toWorkspaceImportPath(projectDir: string, client: ClientConfig): string {
  const indexDir = join(projectDir, "src");
  const workspaceDir = resolve(projectDir, client.output.workspace);
  const workspaceRelative = relativePath(indexDir, workspaceDir);
  const targetRelative =
    !workspaceRelative || workspaceRelative === "."
      ? relativePath(indexDir, resolve(projectDir, client.output.target))
      : workspaceRelative;
  const normalized = targetRelative.replace(/\\/g, "/");
  const withDot = normalized.startsWith(".") ? normalized : `./${normalized}`;
  return withDot === "./" ? "." : withDot;
}

function toIdentifier(name: string): string {
  const sanitized = name.replace(/[^A-Za-z0-9_$]/g, "_");
  if (/^[A-Za-z_$]/.test(sanitized)) {
    return sanitized;
  }
  return `_${sanitized}`;
}

export async function writeClientIndex(projectDir: string, client: ClientConfig, hooksTarget: string) {
  const workspaceDir = resolve(projectDir, client.output.workspace);
  await fs.ensureDir(workspaceDir);

  const targetPath = resolveOutputPath(projectDir, client, client.output.target);
  const hooksPath = resolveOutputPath(projectDir, client, hooksTarget);
  const schemasPath = resolveOutputPath(projectDir, client, client.output.schemas);

  const paths: string[] = [];
  paths.push(normalizeExportPath(workspaceDir, targetPath, "./client"));
  paths.push(normalizeExportPath(workspaceDir, schemasPath, "./model"));
  if (client.orval.mock) {
    const mswTarget = resolveOutputPath(
      projectDir,
      client,
      client.output.target.replace(/\.ts$/, ".msw")
    );
    paths.push(normalizeExportPath(workspaceDir, mswTarget, "./client.msw"));
  }

  const lines: string[] = Array.from(
    new Set(paths.filter((path) => path && path !== "."))
  ).map((path) => `export * from "${path}";`);
  lines.push("");

  await writeFile(join(workspaceDir, "index.ts"), lines.join("\n"));
}

function ensureDotRelative(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  if (normalized === "") {
    return ".";
  }
  if (normalized.startsWith(".")) {
    return normalized;
  }
  return `./${normalized}`;
}

export function resolveGeneratedPath(projectDir: string, client: ClientConfig, target: string): string {
  const direct = resolve(projectDir, client.output.workspace, target);
  if (fs.existsSync(direct)) {
    return direct;
  }
  return resolve(projectDir, target);
}

function withoutExtension(path: string): string {
  return path.replace(/\.[^.]+$/, "");
}

function resolveOutputPath(projectDir: string, client: ClientConfig, target: string): string {
  if (isAbsolute(target)) {
    return target;
  }
  const normalizedTarget = target.replace(/^[.][/\\]/, "");
  const workspaceNormalized = client.output.workspace.replace(/^[.][/\\]/, "");
  if (normalizedTarget.startsWith(workspaceNormalized)) {
    return resolve(projectDir, target);
  }
  return resolve(projectDir, client.output.workspace, target);
}

function normalizeExportPath(workspaceDir: string, absolutePath: string, fallback: string): string {
  const rel = ensureDotRelative(relativePath(workspaceDir, absolutePath));
  const cleaned = rel.replace(/\.ts$/, "");
  if (!cleaned || cleaned === ".") {
    return fallback;
  }
  return cleaned;
}
