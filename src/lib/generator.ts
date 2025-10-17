import { fileURLToPath } from "node:url";
import { dirname, join, relative as relativePath, resolve as resolvePath } from "node:path";
import fs from "fs-extra";
import { execa } from "execa";
import { Logger } from "./logger.js";
import { ResolvedGeneratorConfig } from "./types.js";

interface GeneratorContext {
  logger: Logger;
}

const moduleDir = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = resolvePath(moduleDir, "../../templates");

const TEXT_EXTENSIONS = new Set([
  ".json",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".txt",
  ".gitignore",
]);

const SKIP_DIRECTORIES = new Set(["node_modules", "dist"]);

export async function runGenerator(
  config: ResolvedGeneratorConfig,
  context: GeneratorContext
): Promise<void> {
  const { logger } = context;

  const templateDir = join(TEMPLATE_ROOT, config.template);
  if (!(await fs.pathExists(templateDir))) {
    throw new Error(
      `Template "${config.template}" does not exist under ${TEMPLATE_ROOT}.`
    );
  }

  logger.info(
    `Scaffolding template "${config.template}" into ${config.targetDirectory}`
  );
  await scaffoldTemplate(templateDir, config, logger);

  await fs.ensureDir(config.orval.workspaceAbsolute);

  const swaggerReference = computeSwaggerReference(config);
  const replacements = buildReplacements(config, swaggerReference);

  logger.debug("Applying template variables");
  await applyTemplateVariables(config.targetDirectory, replacements);

  if (config.copySwagger) {
    logger.info(
      `Copying OpenAPI document from ${config.swaggerPath} to ${config.swaggerCopyPath}`
    );
    await copySwagger(config);
  } else if (!config.swaggerIsRemote) {
    logger.info(
      `Using OpenAPI document at ${config.swaggerPath} without copying`
    );
  } else {
    logger.info(`Using remote OpenAPI document at ${config.swaggerPath}`);
  }

  if (config.installDependencies) {
    logger.info(
      `Installing dependencies with ${config.packageManager} in ${config.targetDirectory}`
    );
    await runPackageManagerCommand(config, logger, "install");
  } else {
    logger.warn("Skipping dependency installation (--skip-install provided)");
  }

  if (config.runGenerate) {
    logger.info(`Running orval (${config.orval.command})`);
    await runPackageManagerCommand(config, logger, "run", config.orval.command);

    if (config.orval.postGenerateScript) {
      logger.info(
        `Running post-generate script (${config.orval.postGenerateScript})`
      );
      await runPackageManagerCommand(
        config,
        logger,
        "run",
        config.orval.postGenerateScript
      );
    }
  } else {
    logger.warn("Skipping orval execution (--skip-generate provided)");
  }

  logger.success("API client project scaffolded successfully");
}

async function scaffoldTemplate(
  templateDir: string,
  config: ResolvedGeneratorConfig,
  logger: Logger
) {
  await fs.ensureDir(config.targetDirectory);
  const existingEntries = await fs.readdir(config.targetDirectory);
  if (existingEntries.length > 0 && !config.force) {
    throw new Error(
      `Target directory "${config.targetDirectory}" is not empty. Use --force to overwrite existing files.`
    );
  }

  await fs.copy(templateDir, config.targetDirectory, {
    overwrite: true,
    errorOnExist: false,
    dereference: true,
  });

  if (existingEntries.length > 0 && config.force) {
    logger.warn("Existing files were overwritten due to --force flag.");
  }
}

function buildReplacements(
  config: ResolvedGeneratorConfig,
  swaggerReference: string
): Map<string, string> {
  const replacements = new Map<string, string>();

  const addReplacement = (token: string, value: string) => {
    replacements.set(token, value);
  };

  const toPosix = (value: string) => value.replace(/\\/g, "/");

  const relativeToProject = (fullPath: string) => {
    const rel = relativePath(config.targetDirectory, fullPath);
    if (!rel || rel === ".") {
      return "./";
    }
    return rel.startsWith(".") ? toPosix(rel) : `./${toPosix(rel)}`;
  };

  addReplacement("__PACKAGE_NAME__", config.packageName);
  addReplacement("__PACKAGE_NAME_RAW__", config.projectName);
  addReplacement("__PACKAGE_NAME_UNSCOPED__", config.templateVariables.PACKAGE_NAME_UNSCOPED);
  addReplacement("__PACKAGE_NAME_CAMEL__", config.templateVariables.PACKAGE_NAME_CAMEL);
  addReplacement("__PACKAGE_NAME_PASCAL__", config.templateVariables.PACKAGE_NAME_PASCAL);
  addReplacement("__SWAGGER_PATH__", swaggerReference);
  addReplacement("__SWAGGER_TARGET__", relativeToProject(config.swaggerCopyPath));
  addReplacement("__ORVAL_WORKSPACE__", toPosix(config.orval.workspace));
  addReplacement("__ORVAL_TARGET__", toPosix(config.orval.targetFile));
  addReplacement("__ORVAL_MODE__", config.orval.mode);
  addReplacement("__ORVAL_CLIENT__", config.orval.client);
  addReplacement("__ORVAL_BASE_URL__", config.orval.baseUrl);
  addReplacement("__ORVAL_MOCK__", String(config.orval.mock));
  addReplacement("__ORVAL_PRETTIER__", String(config.orval.prettier));

  for (const [key, value] of Object.entries(config.templateVariables)) {
    const token = `__${key}__`;
    if (!replacements.has(token)) {
      addReplacement(token, value);
    }
  }

  return replacements;
}

async function applyTemplateVariables(
  directory: string,
  replacements: Map<string, string>
): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      await applyTemplateVariables(fullPath, replacements);
      continue;
    }

    if (!TEXT_EXTENSIONS.has(getExtension(entry.name))) {
      continue;
    }

    const original = await fs.readFile(fullPath, "utf8");
    let updated = original;
    for (const [token, value] of replacements.entries()) {
      updated = updated.split(token).join(value);
    }

    if (updated !== original) {
      await fs.writeFile(fullPath, updated, "utf8");
    }
  }
}

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex) : "";
}

function computeSwaggerReference(config: ResolvedGeneratorConfig): string {
  if (config.copySwagger) {
    return makeRelativePath(config.targetDirectory, config.swaggerCopyPath);
  }

  if (config.swaggerIsRemote) {
    return config.swaggerPath;
  }

  return makeRelativePath(config.targetDirectory, config.swaggerPath);
}

function makeRelativePath(from: string, to: string): string {
  const relative = relativePath(from, to);
  if (!relative || relative === ".") {
    return "./";
  }
  const normalized = relative.replace(/\\/g, "/");
  return normalized.startsWith(".") ? normalized : `./${normalized}`;
}

async function copySwagger(config: ResolvedGeneratorConfig) {
  await fs.ensureDir(dirname(config.swaggerCopyPath));
  await fs.copyFile(config.swaggerPath, config.swaggerCopyPath);
}

type PackageManagerCommand = "install" | "run";

async function runPackageManagerCommand(
  config: ResolvedGeneratorConfig,
  logger: Logger,
  command: PackageManagerCommand,
  argument?: string
): Promise<void> {
  const pm = config.packageManager;
  const { executable, args } = buildPackageManagerArgs(pm, command, argument);

  logger.debug(`Executing ${executable} ${args.join(" ")}`);

  await execa(executable, args, {
    cwd: config.targetDirectory,
    stdio: "inherit",
  });
}

function buildPackageManagerArgs(
  pm: ResolvedGeneratorConfig["packageManager"],
  command: PackageManagerCommand,
  argument?: string
) {
  switch (pm) {
    case "npm":
      if (command === "install") {
        return { executable: "npm", args: ["install"] };
      }
      return { executable: "npm", args: ["run", argument ?? "generate"] };
    case "pnpm":
      if (command === "install") {
        return { executable: "pnpm", args: ["install"] };
      }
      return { executable: "pnpm", args: ["run", argument ?? "generate"] };
    case "yarn":
      if (command === "install") {
        return { executable: "yarn", args: ["install"] };
      }
      return { executable: "yarn", args: [argument ?? "generate"] };
    case "bun":
      if (command === "install") {
        return { executable: "bun", args: ["install"] };
      }
      return { executable: "bun", args: ["run", argument ?? "generate"] };
    default:
      throw new Error(`Unsupported package manager "${pm}".`);
  }
}
