#!/usr/bin/env node
/*
Copyright 2025-2026 Eduardo Aparicio Cardenes

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
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
