import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  GithubPublishConfig,
  MultiClientConfig,
  NpmPublishConfig,
  TemplatePlan,
  TemplatePlannedDependency
} from "../types.js";

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

export async function applyPackageJson(
  projectDir: string,
  config: MultiClientConfig,
  templatePlan?: TemplatePlan
) {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) {
    return;
  }
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  pkg.name = resolvePackageName(config);
  pkg.files = Array.isArray(pkg.files) ? pkg.files : [];
  if (!pkg.files.includes("genxapi.manifest.json")) {
    pkg.files.push("genxapi.manifest.json");
  }
  pkg.scripts = pkg.scripts ?? {};
  pkg.scripts["generate"] = "orval --config orval.config.ts";
  pkg.scripts["generate-clients"] = "npm run generate";
  pkg.scripts["build"] = "rimraf dist && rollup -c";
  const npmPublishConfig = config.project.publish?.npm as NpmPublishConfig | undefined;
  const githubPublishConfig = config.project.publish?.github as GithubPublishConfig | undefined;
  pkg.scripts["publish:npm"] = buildPublishCommand(npmPublishConfig);
  pkg.scripts["publish:npm-public"] =
    "npm publish --registry https://registry.npmjs.org/ --access public";
  pkg.scripts["publish:github"] = buildPublishCommand({
    registry: "https://npm.pkg.github.com",
    ...(githubPublishConfig ?? {})
  });
  pkg.scripts["publish"] = "npm run build && npm run publish:npm";
  pkg.scripts["npm-publish"] = "npm run publish";
  applyDependencyPlan(pkg, templatePlan?.dependencies);
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

function applyDependencyPlan(
  pkg: Record<string, any>,
  plannedDependencies: readonly TemplatePlannedDependency[] | undefined
) {
  if (!plannedDependencies) {
    return;
  }

  const versionCatalog = buildVersionCatalog(pkg);
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const;
  const plannedBySection = new Map<
    (typeof sections)[number],
    Record<string, string>
  >();

  for (const dependency of plannedDependencies) {
    const version = versionCatalog.get(dependency.name);
    if (!version) {
      throw new Error(
        `Unable to resolve a package version for "${dependency.name}" in the Orval template dependency plan.`
      );
    }

    const section = plannedBySection.get(dependency.section) ?? {};
    section[dependency.name] = version;
    plannedBySection.set(dependency.section, section);
  }

  for (const sectionName of sections) {
    const section = plannedBySection.get(sectionName);
    if (section && Object.keys(section).length > 0) {
      pkg[sectionName] = sortObject(section);
    } else {
      delete pkg[sectionName];
    }
  }

  if (!pkg.peerDependencies || Object.keys(pkg.peerDependencies).length === 0) {
    delete pkg.peerDependenciesMeta;
  }
}

function buildVersionCatalog(pkg: Record<string, any>): Map<string, string> {
  const catalog = new Map<string, string>();
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const;

  for (const sectionName of sections) {
    const section = pkg[sectionName];
    if (!section || typeof section !== "object") {
      continue;
    }

    for (const [name, version] of Object.entries(section)) {
      if (typeof version === "string") {
        catalog.set(name, version);
      }
    }
  }

  return catalog;
}

function sortObject(value: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  );
}
