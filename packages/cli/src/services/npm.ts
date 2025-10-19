import { execa } from "execa";
import type { Logger } from "../utils/logger.js";

export interface NpmPublishConfig {
  readonly enabled: boolean;
  readonly tag?: string;
  readonly access?: "public" | "restricted";
  readonly dryRun?: boolean;
  readonly tokenEnv?: string;
  readonly registry?: string;
  readonly command?: "npm" | "pnpm" | "yarn" | "bun";
}

interface PublishOptions {
  readonly projectDir: string;
  readonly config: NpmPublishConfig;
  readonly logger: Logger;
}

export async function publishToNpm(options: PublishOptions): Promise<void> {
  const { projectDir, config, logger } = options;

  if (!config.enabled) {
    return;
  }

  const tokenEnv = config.tokenEnv ?? "NPM_TOKEN";
  const token = process.env[tokenEnv];

  if (!token) {
    logger.warn(`Skipping npm publish: environment variable ${tokenEnv} is not set.`);
    return;
  }

  const command = config.command ?? "npm";
  const args = ["publish", "--tag", config.tag ?? "latest", "--access", config.access ?? "public"];

  if (config.dryRun) {
    args.push("--dry-run");
  }

  logger.info("Publishing package to npm...");

  const environment: NodeJS.ProcessEnv = { ...process.env, NPM_TOKEN: token };
  if (config.registry) {
    environment["npm_config_registry"] = config.registry;
  }

  await execa(command, args, {
    cwd: projectDir,
    stdio: "inherit",
    env: environment
  });

  logger.info("npm publish completed successfully.");
}
