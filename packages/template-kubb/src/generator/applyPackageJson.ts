import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { GithubPublishConfig, MultiClientConfig, NpmPublishConfig } from "../types.js";

function resolvePackageName(config: MultiClientConfig): string {
  const baseName = config.project.name;
  const githubPublish = config.project.publish?.github;
  const repoOwner = config.project.repository?.owner;
  const targetsGithubRegistry =
    githubPublish?.enabled &&
    (githubPublish.registry ?? "").includes("npm.pkg.github.com") &&
    !!repoOwner;

  if (targetsGithubRegistry && !baseName.includes("/")) {
    return `@${repoOwner!.replace(/^@/, "")}/${baseName}`;
  }

  return baseName;
}

export async function applyPackageJson(projectDir: string, config: MultiClientConfig) {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) {
    return;
  }
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  pkg.name = resolvePackageName(config);
  pkg.scripts = pkg.scripts ?? {};
  pkg.scripts["generate-clients"] = "kubb generate --config kubb.config.ts";
  const npmPublishConfig = config.project.publish?.npm as NpmPublishConfig | undefined;
  const githubPublishConfig = config.project.publish?.github as GithubPublishConfig | undefined;
  pkg.scripts["publish:npm"] = buildPublishCommand(npmPublishConfig);
  pkg.scripts["publish:npm-public"] =
    "npm publish --registry https://registry.npmjs.org/ --access public";
  pkg.scripts["publish:github"] = buildPublishCommand({
    registry: "https://npm.pkg.github.com",
    ...(githubPublishConfig ?? {})
  });
  pkg.scripts["npm-publish"] = "npm run publish:npm";
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function buildPublishCommand(config: Partial<NpmPublishConfig> | undefined): string {
  const parts: string[] = ["npm", "publish"];
  if (!config) {
    return parts.join(" ");
  }

  const { registry, access, tag, dryRun } = config;

  if (registry) {
    parts.push("--registry", registry);
  }
  if (access === "public") {
    parts.push("--access", "public");
  }
  if (tag && tag !== "latest") {
    parts.push("--tag", tag);
  }
  if (dryRun) {
    parts.push("--dry-run");
  }

  return parts.join(" ");
}
