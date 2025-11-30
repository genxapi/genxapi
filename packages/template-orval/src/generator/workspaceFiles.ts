import { join, relative as relativePath, resolve } from "pathe";
import fs from "fs-extra";
import { writeFile } from "node:fs/promises";
import type { ClientConfig } from "../types.js";

export async function ensureClientWorkspaces(projectDir: string, clients: ClientConfig[]) {
  for (const client of clients) {
    const workspaceDir = resolve(projectDir, client.output.workspace);
    await fs.ensureDir(workspaceDir);
    const targetDir = resolve(projectDir, client.output.target, "..");
    await fs.ensureDir(targetDir);
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

  const targetPath = resolve(projectDir, client.output.target);
  const hooksPath = resolve(projectDir, hooksTarget);
  const schemasPath = resolve(projectDir, client.output.schemas);

  const exports = new Set<string>();
  exports.add(ensureDotRelative(relativePath(workspaceDir, targetPath)));
  exports.add(ensureDotRelative(relativePath(workspaceDir, hooksPath)));
  exports.add(ensureDotRelative(relativePath(workspaceDir, schemasPath)));

  const lines: string[] = Array.from(exports).map((path) => `export * from "${path}";`);
  lines.push("");

  await writeFile(join(workspaceDir, "index.ts"), lines.join("\n"));
}

function ensureDotRelative(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  if (normalized.startsWith(".")) {
    return normalized;
  }
  return `./${normalized}`;
}

export function resolveGeneratedPath(projectDir: string, client: ClientConfig, target: string): string {
  const direct = resolve(projectDir, target);
  if (fs.existsSync(direct)) {
    return direct;
  }
  return resolve(projectDir, client.output.workspace, target);
}
