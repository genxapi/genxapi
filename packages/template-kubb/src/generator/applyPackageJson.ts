import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "pathe";
import type { MultiClientConfig, NpmPublishConfig } from "../types.js";

export async function applyPackageJson(projectDir: string, config: MultiClientConfig) {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) {
    return;
  }
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  pkg.name = config.project.name;
  pkg.scripts = pkg.scripts ?? {};
  pkg.scripts["generate-clients"] = "kubb generate --config kubb.config.ts";
  const npmPublishConfig = config.project.publish?.npm as NpmPublishConfig | undefined;
  pkg.scripts["publish:npm"] = buildPublishCommand(npmPublishConfig);
  pkg.scripts["publish:npm-public"] =
    "npm publish --registry https://registry.npmjs.org/ --access public";
  pkg.scripts["publish:github"] = "npm publish --registry https://npm.pkg.github.com";
  pkg.scripts["npm-publish"] = "npm run publish:npm";
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function buildPublishCommand(config: NpmPublishConfig | undefined): string {
  const parts: string[] = ["npm", "publish"];
  if (!config) {
    return parts.join(" ");
  }

  if (config.registry) {
    parts.push("--registry", config.registry);
  }
  if (config.access === "public") {
    parts.push("--access", "public");
  }
  if (config.tag && config.tag !== "latest") {
    parts.push("--tag", config.tag);
  }
  if (config.dryRun) {
    parts.push("--dry-run");
  }

  return parts.join(" ");
}
