#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "..");
const WORKSPACE = "@genxapi/cli";

async function main() {
  const packRoot = resolve(process.env.TMPDIR ?? "/tmp", "genxapi-pack-");
  const packDir = await mkdtemp(packRoot);
  const execRoot = resolve(process.env.TMPDIR ?? "/tmp", "genxapi-exec-");
  const execDir = await mkdtemp(execRoot);
  const execNpmrc = resolve(execDir, ".npmrc");
  const execGlobalNpmrc = resolve(execDir, ".npmrc-global");
  const npmEnv = {
    ...process.env,
    NPM_CONFIG_USERCONFIG: execNpmrc,
    NPM_CONFIG_GLOBALCONFIG: execGlobalNpmrc,
    NPM_TOKEN: "",
    GITHUB_TOKEN: ""
  };

  await runCommand("npm", ["run", "build:template"], { cwd: ROOT_DIR });

  await runCommand("npm", ["pack", "--workspace", WORKSPACE, "--pack-destination", packDir], {
    cwd: ROOT_DIR
  });

  const tarballPath = await resolvePackedTarball(packDir);

  await verifyBinTargets(tarballPath);

  await runCommand("npm", ["init", "-y"], { cwd: execDir });
  await writeFile(execNpmrc, "registry=https://registry.npmjs.org/\\n", "utf8");
  await writeFile(execGlobalNpmrc, "registry=https://registry.npmjs.org/\\n", "utf8");
  await runCommand(
    "npm",
    [
      "install",
      "--no-save",
      "--no-audit",
      "--no-fund",
      "--loglevel=error",
      "--registry",
      "https://registry.npmjs.org/",
      tarballPath,
      `file:${resolve(ROOT_DIR, "packages", "template-kubb")}`,
      `file:${resolve(ROOT_DIR, "packages", "template-orval")}`
    ],
    { cwd: execDir, env: npmEnv }
  );
  await runCommand("npx", ["--no-install", "@genxapi/cli", "--help"], { cwd: execDir, env: npmEnv });
  await runCommand("npx", ["--no-install", "cli", "--help"], { cwd: execDir, env: npmEnv });
  await runCommand("npx", ["--no-install", "genxapi", "--help"], { cwd: execDir, env: npmEnv });

  await unlink(tarballPath);
  await rm(packDir, { recursive: true, force: true });
  await rm(execDir, { recursive: true, force: true });
  console.log("CLI pack smoke test completed successfully.");
}

async function verifyBinTargets(tarballPath) {
  const pkgPath = resolve(ROOT_DIR, "packages", "cli", "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  const binTargets = extractBinTargets(pkg.bin);
  if (binTargets.length === 0) {
    throw new Error("No bin targets found in packages/cli/package.json.");
  }

  const tarList = await runCapture("tar", ["-tf", tarballPath], { cwd: ROOT_DIR });
  const entries = new Set(tarList.split("\n").filter(Boolean));

  for (const target of binTargets) {
    const normalized = target.replace(/^\.\/?/, "");
    const entry = `package/${normalized}`;
    if (!entries.has(entry)) {
      throw new Error(`Packed tarball missing bin target: ${entry}`);
    }
  }
}

function extractBinTargets(binField) {
  if (!binField) return [];
  if (typeof binField === "string") return [binField];
  if (typeof binField === "object") return Object.values(binField);
  return [];
}

function runCommand(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function runCapture(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "inherit"] });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise(output);
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function resolvePackedTarball(packDir) {
  const entries = await readdir(packDir);
  const tarballs = entries.filter((entry) => entry.endsWith(".tgz"));
  if (tarballs.length === 0) {
    throw new Error("No tarball produced by npm pack.");
  }
  if (tarballs.length > 1) {
    throw new Error(`Multiple tarballs found in ${packDir}; expected one.`);
  }
  return resolve(packDir, tarballs[0]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
