#!/usr/bin/env node
import { execSync } from "node:child_process";

const major = Number(process.versions.node.split(".")[0]);
if (Number.isNaN(major) || major < 18) {
  console.error("genxapi requires Node.js 18 or higher.");
  process.exit(1);
}

const args = process.argv.slice(2).map((arg) => JSON.stringify(arg)).join(" ");
const command = `npx --yes @genxapi/cli@latest${args ? " " + args : ""}`;

try {
  execSync(command, { stdio: "inherit" });
} catch (error) {
  if (typeof error?.status === "number") {
    process.exit(error.status);
  }
  if (error?.signal) {
    process.kill(process.pid, error.signal);
  }
  process.exit(1);
}
