import { existsSync } from "node:fs";
import { join } from "node:path";
import { execa } from "execa";
import type { GenerateClientsOptions } from "../types.js";

export async function runKubb(projectDir: string, packageManager: string, logger: GenerateClientsOptions["logger"]) {
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

export async function runHooks(hooks: string[], projectDir: string, logger: GenerateClientsOptions["logger"]) {
  for (const command of hooks) {
    logger?.info?.(`Running hook: ${command}`);
    await execa(command, {
      cwd: projectDir,
      shell: true,
      stdio: "inherit"
    });
  }
}

export async function installDependencies(projectDir: string, packageManager: string, logger: GenerateClientsOptions["logger"]) {
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
