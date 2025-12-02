import { join, relative as relativePath, resolve } from "node:path";
import fs from "fs-extra";
import { writeFile } from "node:fs/promises";
import type { ClientConfig } from "../types.js";

export async function ensureClientWorkspaces(projectDir: string, clients: ClientConfig[]) {
  for (const client of clients) {
    const workspaceDir = resolve(projectDir, client.output.workspace);
    await fs.ensureDir(workspaceDir);
    const targetDir = resolve(
      workspaceDir,
      relativePath(client.output.workspace, client.output.target),
      ".."
    );
    const schemasDir = resolve(
      workspaceDir,
      relativePath(client.output.workspace, client.output.schemas ?? "model")
    );
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

export async function writeClientIndex(projectDir: string, client: ClientConfig) {
  const workspaceDir = resolve(projectDir, client.output.workspace);
  await fs.ensureDir(workspaceDir);

  const targetRel = relativePath(client.output.workspace, client.output.target);
  const schemasRel = relativePath(client.output.workspace, client.output.schemas ?? "model");
  const targetPath = resolve(workspaceDir, targetRel);
  const schemasPath = resolve(workspaceDir, schemasRel);

  const paths = [
    normalizeExportPath(workspaceDir, targetPath, "./client"),
    normalizeExportPath(workspaceDir, schemasPath, "./model")
  ];

  const lines = Array.from(new Set(paths.filter(Boolean))).map((path) => `export * from "${path}";`);
  lines.push("");
  await writeFile(join(workspaceDir, "index.ts"), lines.join("\n"));
}

function toWorkspaceImportPath(projectDir: string, client: ClientConfig): string {
  const indexDir = join(projectDir, "src");
  const workspaceDir = resolve(projectDir, client.output.workspace);
  const workspaceRelative = relativePath(indexDir, workspaceDir);
  const normalized = workspaceRelative.replace(/\\/g, "/");
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

function normalizeExportPath(workspaceDir: string, absolutePath: string, fallback: string): string {
  const rel = relativePath(workspaceDir, absolutePath).replace(/\\/g, "/");
  const withDot = rel.startsWith(".") ? rel : `./${rel}`;
  const withoutExt = withDot.replace(/\.ts$/, "");
  if (!withoutExt || withoutExt === ".") {
    return fallback;
  }
  return withoutExt;
}
