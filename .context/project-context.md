# @eduardoac/api-clients — Project Context

> Goal: Preserve the intent and structure of the original context document while reflecting the current implementation of the monorepo. Every item that used to be called out (config, CLI, template, tooling, examples) still appears below, updated to the latest architecture.

---

## 0️⃣ TL;DR

- Monorepo managed with npm workspaces.
- Two published packages: CLI (`@eduardoac/generate-api-client`) and template (`@eduardoac/api-client-template`).
- Generates multiple Orval clients from shared config, supports hooks, and can create GitHub releases via Octokit.
- Tooling: TypeScript ES2022, Rollup, Vitest v3, ESLint/Prettier, optional Orval peer.

---

## 🏗️ Project File Structure (Current)

```plaintext
/ (root)
 ├── README.md
 ├── package.json          # Private workspace orchestrator
 ├── scripts/
 │    └── clean.mjs         # Cleans dist/coverage for all packages
 ├── samples/
 │    └── multi-client.config.json
 ├── packages/
 │    ├── api-client-template/
 │    │    ├── package.json
 │    │    └── src/...
 │    └── generate-api-client/
 │         ├── package.json
 │         └── src/...
 ├── tsconfig.base.json
 ├── .npmrc
 ├── vitest.config.ts
 ├── .eslintrc.cjs
 ├── .prettierrc.json
 └── .gitignore
```

Each numbered section below retains the original doc’s “Purpose + Path + Example Snippet” structure, now aligned with the actual repo.

---

## 1️⃣ `.context/project-context.md` (this file)

✅ **Purpose:** Living source of truth for the repo’s architecture, replacing the old `/docs/context.md`.

```markdown
# @eduardoac/api-clients — Project Context
> Goal: ...
```

---

## 2️⃣ `README.md` (root)

✅ **Purpose:** Entry point for contributors—install, build/test workflow, publishing instructions.

```markdown
# @eduardoac/api-clients

Monorepo that hosts:
- `@eduardoac/api-client-template`
- `@eduardoac/generate-api-client`

## Getting Started
```

---

## 3️⃣ `package.json` (root workspace)

✅ **Purpose:** Defines workspaces, shared scripts, and dev tooling (`typescript`, `eslint`, `prettier`, etc.). Node ≥24 required.

```json
{
  "name": "@eduardoac/api-clients-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspace @eduardoac/api-client-template && ...",
    "typecheck": "tsc -p packages/api-client-template/tsconfig.json --noEmit && tsc -p packages/generate-api-client/tsconfig.json --noEmit"
  }
}
```

---

## 4️⃣ `samples/multi-client.config.json`

✅ **Purpose:** Concrete configuration example consumed by the CLI/template. Replaces the simple `api-client-generatorrc.json` from the old doc with multi-client support.

```json
{
  "$schema": ".../generate-api-client.schema.json",
  "project": {
    "name": "multi-client-demo",
    "directory": "./examples/multi-client-demo",
    "packageManager": "npm"
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "./specs/petstore.yaml",
      "output": { "workspace": "./src/pets", "target": "./src/pets/client.ts" }
    }
  ]
}
```

---

## 5️⃣ `scripts/clean.mjs`

✅ **Purpose:** Aligns with the “utility scripts” concept from the original plan—cleans build artifacts for both packages.

```js
import { rm } from "node:fs/promises";

const targets = [
  "packages/api-client-template/dist",
  "packages/generate-api-client/dist",
  "packages/api-client-template/coverage",
  "packages/generate-api-client/coverage"
];

await Promise.all(targets.map((target) => rm(target, { recursive: true, force: true })));
```

---

## 6️⃣ `tsconfig.base.json`

✅ **Purpose:** Shared TypeScript settings replacing the single-project `tsconfig.json` in the old doc.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["packages/*/src", "samples"]
}
```

---

## 7️⃣ `vitest.config.ts`

✅ **Purpose:** Root test runner configuration (Vitest v3) covering both workspaces, replacing the former doc’s generic mention of tests.

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/api-client-template/src/**/*.test.ts",
      "packages/generate-api-client/src/**/*.test.ts"
    ],
    coverage: { reporter: ["text", "lcov"] }
  }
});
```

---

## 8️⃣ `.eslintrc.cjs` & `.prettierrc.json`

✅ **Purpose:** Modern lint/format stack (ESLint, @typescript-eslint, Prettier) continuing the original “keep generated code clean” goal.

```js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"]
};
```

```json
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100
}
```

---

## 9️⃣ Package: `@eduardoac/api-client-template`

- **Path**: `packages/api-client-template`
- **Purpose** (updated): Reusable module that loads multi-client configs, scaffolds template projects, applies token replacements, and optionally executes Orval + hooks.
- **Highlights**:
  - `src/generator.ts`: Handles filesystem work, Orval command execution via `execa`, hook orchestration.
  - `src/types.ts`: Zod schemas (`MultiClientConfigSchema`, etc.) including optional `repository` and `publish.npm` support.
  - `src/template/`: Base project (Rollup config, TypeScript configs, placeholder runtime).
  - `rollup.config.mjs`: Bundles ESM + types.
  - `package.json`: Runs on Node ≥18, depends on `cosmiconfig`, `fs-extra`, `globby`, optional peer `orval`, publishes with `publishConfig.access = restricted`.
  - Scripts include `publish:npm`, `publish:npm-public`, and `publish:github` for whichever registry you target.

```ts
export async function generateClients(config: MultiClientConfig, options: GenerateClientsOptions = {}) {
  // scaffold template, apply replacements, copy swagger docs, run hooks,
  // invoke orval (via pnpm/yarn/npm/bun), log success
}
```

---

## 🔟 Package: `@eduardoac/generate-api-client`

- **Path**: `packages/generate-api-client`
- **Purpose**: CLI that wraps the template package and adds GitHub release automation.
- **Highlights**:
  - `src/index.ts`: Commander commands (`generate`, `publish`), log-level handling.
  - `src/commands/*`: `runGenerateCommand`, `runPublishCommand` (with `ora` spinners and Octokit).
  - `src/config/loader.ts`: Cosmiconfig loader supporting JSON/YAML + CLI override.
  - `schemas/generate-api-client.schema.json`: JSON schema for configs.
  - `src/services/github.ts`: GitHub automation (repo bootstrap, branch push, PR creation).
  - `src/services/npm.ts`: Optional npm publish workflow.
  - `src/utils/swaggerDiff.ts`: Analyzes Swagger diffs and classifies semantic-release commit type (`feat`/`fix`/`chore`).
  - `package.json`: ships CLI binaries, marks publishConfig as `restricted` while under development.
  - Scripts include `publish:npm`, `publish:npm-public`, and `publish:github` to push releases to private npm or GitHub Packages.
  - Depends on `chalk`, `commander`, `cosmiconfig`, `octokit`, `ora`, `execa`, `zod`, and of course `@eduardoac/api-client-template`.

```ts
program
  .command("generate")
  .option("-c, --config <path>")
  .option("--dry-run")
  .action(async (opts) => {
    const { config, configDir } = await loadCliConfig({ file: opts.config });
    await runGenerateCommand({ config, configDir, logger, dryRun: opts.dryRun });
  });
```

---

## 1️⃣1️⃣ Example / Sample Output

While we don’t keep generated SDKs in-repo, the `samples/multi-client.config.json` plus documentation in package READMEs mirror the original “examples/sample-api” intent. Running:

```bash
node packages/generate-api-client/dist/index.js generate --config samples/multi-client.config.json --dry-run
```

demonstrates configuration validation and log output without touching the filesystem.

---

## 1️⃣2️⃣ Tooling & Release Flow

| Command | Description |
|---------|-------------|
| `npm install` | Installs workspaces (Node ≥24 recommended to avoid engine warnings). |
| `npm run build` | Builds template + CLI via Rollup. |
| `npm test` | Runs Vitest suites. |
| `npm run clean` | Removes `dist/coverage`. |
| `npm run npm-publish --workspace <pkg>` | Publishes template or CLI (replaces old “npm publish” command naming). |
| `generate-api-client generate` | Generates clients, optionally syncs GitHub repositories and runs npm publish. |
| `generate-api-client publish` | Uses Octokit to create GitHub releases (token required). |

**Runtime note:** Orval 7.x bundles Commander 14, which requires Node 20+. Running generation on Node 18 works but prints engine warnings; encourage contributors to use Node ≥20 for a clean experience.

Security snapshot (as of 2025-10-18):
- `npm audit` → **0 vulnerabilities** after removing direct `@orval/core` dependency.
- Orval remains a peer/consumer responsibility, preventing vulnerable `validator` tree from landing automatically.

---

## 🚀 Next Steps & Enhancements

- Optional: move this file to `/docs` and add diagrams for generation flow.
- Provide additional config samples (hooks, remote swagger, skip install/generate cases).
- Consider adding an `examples/` workspace that runs the CLI to produce actual clients for smoke testing.
- Automate release tagging / changelog generation (e.g., Changesets) building on the `publish` command.

---

_Last updated: 2025-10-18_
