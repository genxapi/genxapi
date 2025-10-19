#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, relative } from "node:path";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "..");
const WORKSPACES_DIR = resolve(ROOT_DIR, "packages");

const BUILT_IN_PRESETS = {
  npm: { registry: "https://registry.npmjs.org/", access: "public" },
  public: { registry: "https://registry.npmjs.org/", access: "public" },
  github: { registry: "https://npm.pkg.github.com", access: "restricted" },
  "github-packages": { registry: "https://npm.pkg.github.com", access: "restricted" },
  gh: { registry: "https://npm.pkg.github.com", access: "restricted" }
};

const WORKSPACE_ALIASES = new Map([
  ["template-orval", "@genxapi/template-orval"],
  ["orval", "@genxapi/template-orval"],
  ["template-kubb", "@genxapi/template-kubb"],
  ["kubb", "@genxapi/template-kubb"],
  ["cli", "@genxapi/cli"],
  ["genxapi-cli", "@genxapi/cli"]
]);

const ALLOWED_COMMANDS = new Set(["npm", "pnpm", "yarn", "bun"]);
const REGISTRY_FLAG_COMMANDS = new Set(["npm", "pnpm"]);
const ALLOWED_ACCESS = new Set(["public", "restricted"]);

async function main() {
  try {
    const argv = process.argv.slice(2);
    const options = parseArgs(argv);
    if (options.printConfig === undefined) {
      options.printConfig = true;
    }

    if (options.help) {
      printHelp();
      process.exit(0);
    }

    const rootPackageJson = await readJson(resolve(ROOT_DIR, "package.json"));
    const publishConfigRoot = rootPackageJson.genxapiPublish ?? {};
    const configuredAliases = publishConfigRoot.aliases ?? {};

    if (options.list) {
      await printWorkspaces();
      process.exit(0);
    }

    const configFromFile = await loadConfigFile(options.config);

    const selector =
      options.workspace ??
      options.package ??
      options.name ??
      options.template ??
      options.positional[0] ??
      configFromFile.workspace ??
      configFromFile.package ??
      configFromFile.template;

    if (!selector) {
      console.error("Error: No workspace or template specified. Use --workspace, --template, or provide a positional argument.");
      process.exit(1);
    }

    const workspaceName = await resolveWorkspaceName(selector, configuredAliases);
    const workspace = await loadWorkspace(workspaceName);
    if (!workspace) {
      console.error(`Error: Unable to locate workspace for "${selector}".`);
      await printWorkspaces();
      process.exit(1);
    }

    const defaults = {
      command: "npm",
      tag: "latest",
      tokenEnv: "NPM_TOKEN"
    };

    const mergedConfig = mergeOptions(
      defaults,
      publishConfigRoot.defaults,
      publishConfigRoot.workspaces?.[workspace.packageJson.name],
      normalisePublishConfig(workspace.packageJson.publishConfig),
      resolvePreset(configFromFile.pkgManager ?? configFromFile.registry, publishConfigRoot.presets),
      extractPublishOptions(configFromFile),
      resolvePreset(options.pkgManager ?? options.registry, publishConfigRoot.presets),
      extractPublishOptions(options)
    );

    if (mergedConfig.pkgManager) {
      Object.assign(
        mergedConfig,
        resolvePreset(mergedConfig.pkgManager, publishConfigRoot.presets)
      );
      delete mergedConfig.pkgManager;
    }

    if (mergedConfig.registry) {
      Object.assign(
        mergedConfig,
        resolvePreset(mergedConfig.registry, publishConfigRoot.presets)
      );
    }

    const publishOptions = finaliseOptions(mergedConfig);

    if (publishOptions.enabled === false) {
      console.log(`Publishing is disabled for ${workspace.packageJson.name}. Use --publish to override.`);
      return;
    }
    delete publishOptions.enabled;

    if (options.printConfig) {
      printConfigurationSummary(workspace, publishOptions);
    }

    await ensureTokenAvailable(publishOptions, options.ignoreMissingToken);

    await runPublishCommand(workspace, publishOptions, options);

    const resultLabel = publishOptions.dryRun ? "Publish dry-run completed for" : "Published";
    console.log(
      `\n${resultLabel} ${workspace.packageJson.name}@${workspace.packageJson.version ?? "latest"} from ${relative(
        ROOT_DIR,
        workspace.dir
      )}`
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(String(error));
    }
    process.exit(1);
  }
}

function parseArgs(argv) {
  const options = {
    positional: []
  };

  for (let i = 0; i < argv.length; i += 1) {
    const entry = argv[i];
    if (!entry.startsWith("-")) {
      options.positional.push(entry);
      continue;
    }

    const [flag, rawValue] = entry.includes("=") ? entry.split("=", 2) : [entry, undefined];

    const value =
      rawValue !== undefined
        ? rawValue
        : i + 1 < argv.length && !argv[i + 1].startsWith("-")
          ? argv[++i]
          : undefined;

    switch (flag) {
      case "--workspace":
      case "--package":
      case "--name":
        options.workspace = requireValue(flag, value);
        break;
      case "--template":
        options.template = requireValue(flag, value);
        break;
      case "--config":
        options.config = requireValue(flag, value);
        break;
      case "--registry":
        options.registry = requireValue(flag, value);
        break;
      case "--pkg-manager":
      case "--preset":
        options.pkgManager = requireValue(flag, value);
        break;
      case "--access":
        options.access = requireValue(flag, value);
        break;
      case "--tag":
        options.tag = requireValue(flag, value);
        break;
      case "--command":
        options.command = requireValue(flag, value);
        break;
      case "--token-env":
        options.tokenEnv = requireValue(flag, value);
        break;
      case "--otp":
        options.otp = requireValue(flag, value);
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--no-dry-run":
        options.dryRun = false;
        break;
      case "--ignore-missing-token":
        options.ignoreMissingToken = true;
        break;
      case "--print-config":
        options.printConfig = true;
        break;
      case "--no-print-config":
        options.printConfig = false;
        break;
      case "--publish":
        options.enabled = true;
        break;
      case "--no-publish":
        options.enabled = false;
        break;
      case "--list":
        options.list = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        console.error(`Unknown option: ${flag}`);
        process.exit(1);
    }
  }

  return options;
}

function requireValue(flag, value) {
  if (value === undefined) {
    console.error(`Option ${flag} requires a value.`);
    process.exit(1);
  }
  return value;
}

async function resolveWorkspaceName(selector, configuredAliases) {
  if (!selector) {
    throw new Error("Workspace selector is required");
  }
  const trimmed = selector.trim();
  if (WORKSPACE_ALIASES.has(trimmed)) {
    return WORKSPACE_ALIASES.get(trimmed);
  }
  if (configuredAliases && configuredAliases[trimmed]) {
    return configuredAliases[trimmed];
  }
  if (trimmed.includes("/")) {
    return trimmed;
  }
  if (trimmed.startsWith("@")) {
    return trimmed;
  }
  if (trimmed.startsWith("template-")) {
    return `@genxapi/${trimmed}`;
  }
  return `@genxapi/${trimmed}`;
}

async function loadWorkspace(workspaceName) {
  const candidates = await discoverWorkspaces();
  return candidates.find((entry) => entry.packageJson.name === workspaceName);
}

async function discoverWorkspaces() {
  if (!existsSync(WORKSPACES_DIR)) {
    return [];
  }
  const entries = await readdir(WORKSPACES_DIR, { withFileTypes: true });
  const workspaces = [];
  for (const dirent of entries) {
    if (!dirent.isDirectory()) continue;
    const dir = join(WORKSPACES_DIR, dirent.name);
    const pkgPath = join(dir, "package.json");
    if (!existsSync(pkgPath)) continue;
    const packageJson = await readJson(pkgPath);
    workspaces.push({ dir, packageJson });
  }
  return workspaces;
}

async function readJson(path) {
  const content = await readFile(path, "utf8");
  return JSON.parse(content);
}

async function loadConfigFile(configPath) {
  if (!configPath) {
    return {};
  }
  const resolved = resolve(ROOT_DIR, configPath);
  if (!existsSync(resolved)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }
  const data = await readJson(resolved);
  return data.publish ?? data;
}

function extractPublishOptions(source = {}) {
  const result = {};
  if (typeof source.registry === "string") {
    result.registry = source.registry;
  }
  if (typeof source.access === "string") {
    result.access = source.access;
  }
  if (typeof source.tag === "string") {
    result.tag = source.tag;
  }
  if (typeof source.command === "string") {
    result.command = source.command;
  }
  if (typeof source.tokenEnv === "string") {
    result.tokenEnv = source.tokenEnv;
  }
  if (source.dryRun !== undefined) {
    result.dryRun = Boolean(source.dryRun);
  }
  if (source.enabled !== undefined) {
    result.enabled = Boolean(source.enabled);
  }
  if (typeof source.pkgManager === "string") {
    result.pkgManager = source.pkgManager;
  }
  if (typeof source.otp === "string") {
    result.otp = source.otp;
  }
  return result;
}

function normalisePublishConfig(publishConfig = {}) {
  if (!publishConfig || typeof publishConfig !== "object") {
    return {};
  }
  const result = {};
  if (typeof publishConfig.registry === "string") {
    result.registry = publishConfig.registry;
  }
  if (typeof publishConfig.access === "string") {
    result.access = publishConfig.access;
  }
  if (typeof publishConfig.tag === "string") {
    result.tag = publishConfig.tag;
  }
  if (typeof publishConfig.command === "string") {
    result.command = publishConfig.command;
  }
  if (typeof publishConfig.tokenEnv === "string") {
    result.tokenEnv = publishConfig.tokenEnv;
  }
  if (publishConfig.dryRun !== undefined) {
    result.dryRun = Boolean(publishConfig.dryRun);
  }
  if (publishConfig.enabled !== undefined) {
    result.enabled = Boolean(publishConfig.enabled);
  }
  return result;
}

function resolvePreset(name, customPresets = {}) {
  if (!name || typeof name !== "string") {
    return {};
  }
  const normalised = name.trim().toLowerCase();
  const preset = {
    ...(BUILT_IN_PRESETS[normalised] ?? {}),
    ...(customPresets?.[normalised] ?? {})
  };
  if (Object.keys(preset).length === 0 && normalised.includes("://")) {
    return { registry: name };
  }
  if (Object.keys(preset).length === 0) {
    return {};
  }
  return preset;
}

function mergeOptions(...layers) {
  const result = {};
  for (const layer of layers) {
    if (!layer || typeof layer !== "object") continue;
    for (const [key, value] of Object.entries(layer)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
}

function finaliseOptions(options) {
  const config = { ...options };

  if (config.registry && !config.registry.includes("://")) {
    const fallback = resolvePreset(config.registry);
    Object.assign(config, fallback);
  }

  if (config.access && !ALLOWED_ACCESS.has(config.access)) {
    throw new Error(`Invalid access level "${config.access}". Expected one of: ${[...ALLOWED_ACCESS].join(", ")}`);
  }
  if (config.command && !ALLOWED_COMMANDS.has(config.command)) {
    throw new Error(
      `Invalid publish command "${config.command}". Expected one of: ${[...ALLOWED_COMMANDS].join(", ")}`
    );
  }

  config.command = config.command ?? "npm";
  config.tag = config.tag ?? "latest";
  config.tokenEnv = config.tokenEnv ?? "NPM_TOKEN";

  return config;
}

async function ensureTokenAvailable(options, ignoreMissing) {
  if (!options.tokenEnv) {
    return;
  }
  if (options.dryRun) {
    return;
  }
  const token = process.env[options.tokenEnv];
  if (!token && options.access === "restricted" && !ignoreMissing) {
    throw new Error(
      `Environment variable ${options.tokenEnv} is required for restricted publishing. Use --ignore-missing-token to bypass.`
    );
  }
}

async function runPublishCommand(workspace, options, meta) {
  const args = ["publish"];

  if (options.tag && options.tag.length > 0) {
    args.push("--tag", options.tag);
  }
  if (options.access) {
    args.push("--access", options.access);
  }
  if (options.registry && options.registry.includes("://") && REGISTRY_FLAG_COMMANDS.has(options.command)) {
    args.push("--registry", options.registry);
  }
  if (options.dryRun) {
    args.push("--dry-run");
  }
  if (options.otp) {
    args.push("--otp", options.otp);
  }

  const environment = { ...process.env };
  if (options.registry && options.registry.includes("://")) {
    environment.npm_config_registry = options.registry;
  }

  if (meta.printConfig ?? true) {
    console.log(
      `\nPublishing ${workspace.packageJson.name} from ${relative(ROOT_DIR, workspace.dir)} using ${options.command}`
    );
    console.log(
      [
        options.registry ? `  registry: ${options.registry}` : undefined,
        options.access ? `  access: ${options.access}` : undefined,
        options.tag ? `  tag: ${options.tag}` : undefined,
        options.dryRun ? "  dry-run: true" : undefined
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  await spawnAsync(options.command, args, {
    cwd: workspace.dir,
    stdio: "inherit",
    env: environment
  });
}

function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Publish command exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

function printHelp() {
  console.log(`Usage: npm run publish -- [options]

Options:
  --workspace <name>       Workspace package name or alias
  --template <alias>       Template alias (e.g. template-orval, template-kubb)
  --registry <preset|url>  Registry preset (npm, github) or explicit URL
  --pkg-manager <name>     Alias for --registry presets
  --access <level>         Publish access (public|restricted)
  --tag <tag>              Distribution tag (default: latest)
  --command <tool>         Publish command (npm|pnpm|yarn|bun)
  --token-env <name>       Environment variable holding auth token
  --dry-run                Perform a dry-run publish
  --ignore-missing-token   Do not fail if token environment variable is unset
  --publish                Force-enable publishing even if disabled in config
  --no-publish             Skip publishing when a config disables it
  --otp <code>             Pass a one-time password to the publish command
  --config <file>          Load publish options from JSON configuration file
  --print-config           Print resolved configuration (default: true)
  --no-print-config        Suppress configuration summary output
  --list                   List available workspaces
  --help                   Show this help message
`);
}

async function printWorkspaces() {
  const workspaces = await discoverWorkspaces();
  if (workspaces.length === 0) {
    console.log("No workspaces found.");
    return;
  }
  console.log("Available workspaces:");
  for (const workspace of workspaces) {
    console.log(`  - ${workspace.packageJson.name}`);
  }
}

function printConfigurationSummary(workspace, options) {
  console.log(
    `Resolved publish configuration for ${workspace.packageJson.name}: ${JSON.stringify(
      {
        registry: options.registry,
        access: options.access,
        tag: options.tag,
        command: options.command,
        tokenEnv: options.tokenEnv,
        dryRun: options.dryRun ?? false
      },
      null,
      2
    )}`
  );
}

main();
