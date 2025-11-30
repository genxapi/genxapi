import { dirname, resolve } from "pathe";
import fs from "fs-extra";
import type { ClientConfig } from "../types.js";

export async function ensureClientWorkspaces(projectDir: string, clients: ClientConfig[]) {
  for (const client of clients) {
    const workspaceDir = resolve(projectDir, client.output.workspace);
    await fs.ensureDir(workspaceDir);
    const targetDir = resolve(projectDir, dirname(client.output.target));
    await fs.ensureDir(targetDir);
  }
}
