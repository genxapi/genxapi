# @genxapi/genxapi — Project Context

> Goal: Keep the original context document’s intent while reflecting today’s architecture: renamed templates, unified configuration, and the CLI workflow that orchestrates them.

---

## 0️⃣ TL;DR

- Monorepo managed with npm workspaces on Node ≥ 24.
- Three published packages:
  - `@genxapi/cli` — the CLI/orchestrator.
  - `@genxapi/template-orval` — first-party Orval adapter.
  - `@genxapi/template-kubb` — first-party Kubb adapter.
- Configuration is now **engine-agnostic**: `project.template` chooses `orval` or `kubb`, while `project.config` / `clients[].config` capture shared options (`httpClient`, `client`, `mode`, `mock`, plugin overrides).
- CLI exposes the same knobs via flags (`--template`, `--http-client`, `--client`, `--mode`, `--mock-*`).
- Tooling: TypeScript (ES2022), Rollup, Vitest v3, ESLint/Prettier.

---

## 🏗️ Project File Structure (Current)

```plaintext
/ (root)
 ├── README.md
 ├── package.json                 # Private workspace orchestrator
 ├── scripts/
 │    └── clean.mjs               # Removes dist/coverage across packages
 ├── samples/
 │    ├── orval-multi-client.config.json    # Orval-focused unified config sample
 │    └── kubb-multi-client.config.json     # Kubb-focused unified config sample
 ├── packages/
 │    ├── template-orval/
 │    │    ├── package.json
 │    │    └── src/...
 │    ├── template-kubb/
 │    │    ├── package.json
 │    │    └── src/...
 │    └── cli/
 │         ├── package.json
 │         └── src/...
 ├── packages/cli/schemas/
 │    └── genxapi.schema.json  # Unified JSON schema
 ├── tsconfig.base.json
 ├── vitest.config.ts
 ├── .npmrc
 ├── docs/
 │    └── … (configuration, scope, templates)
 └── .context/
      ├── project-context.md       # This file
      ├── troubleshooting.md
      ├── docs-upgrade-playbook.md
      └── toolkit.md
```

Each numbered section below retains the “purpose + path + example” format from the original context.

---

## 1️⃣ `.context/project-context.md` (this file)

✅ **Purpose:** Single reference for architecture, naming, samples, and tooling.

---

## 2️⃣ `README.md`

✅ **Purpose:** Contributor entry point – highlights unified config, CLI flags (`--template`, `--http-client`, etc.), quickstart install commands, and links to detailed docs (`docs/configuration/unified-generator-config.md`).

---

## 3️⃣ `package.json` (root workspace)

✅ **Purpose:** Declares workspaces (`packages/*`), shared scripts, and dev tooling. Scripts reference renamed packages:

```json
{
  "scripts": {
    "build": "npm run build --workspace @genxapi/template-orval && npm run build --workspace @genxapi/template-kubb && npm run build --workspace @genxapi/cli",
    "typecheck": "tsc -p packages/template-orval/tsconfig.json --noEmit && tsc -p packages/template-kubb/tsconfig.json --noEmit && tsc -p packages/cli/tsconfig.json --noEmit"
  }
}
```

---

## 4️⃣ `samples/*.config.json`

✅ **Purpose:** Canonical **unified** configuration examples consumed by the CLI.

### `samples/orval-multi-client.config.json`
```json
{
  "$schema": "https://raw.githubusercontent.com/genxapi/genxapi/main/schemas/genxapi.schema.json",
  "logLevel": "info",
  "project": {
    "name": "multi-client-demo",
    "directory": "../examples/multi-client-demo",
    "template": "orval",
    "output": "./src",
    "config": {
      "httpClient": "axios",
      "client": "react-query",
      "mode": "split",
      "mock": { "type": "msw", "useExamples": true }
    }
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": { "baseUrl": "https://api.pets.local" }
    },
    {
      "name": "store",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": {
        "client": "axios",
        "httpClient": "axios",
        "baseUrl": "https://api.store.local",
        "mock": { "type": "off" }
      }
    }
  ]
}
```

### `samples/kubb-multi-client.config.json`
```json
{
  "project": {
    "name": "multi-client-kubb-demo",
    "directory": "../examples/multi-client-kubb",
    "template": "kubb",
    "output": "./src",
    "config": {
      "httpClient": "fetch",
      "plugins": {
        "client": { "dataReturnType": "data" },
        "ts": { "enumType": "asConst" }
      }
    }
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": { "baseUrl": "https://api.pets.local" }
    },
    {
      "name": "store",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": {
        "httpClient": "axios",
        "plugins": {
          "client": { "dataReturnType": "full" },
          "ts": { "enumType": "enum" }
        },
        "baseUrl": "https://api.store.local" }
    }
  ]
}
```

---

## 5️⃣ `scripts/clean.mjs`

✅ **Purpose:** Cleans build artefacts for all packages using the new directory names.

```js
const targets = [
  "packages/template-orval/dist",
  "packages/template-kubb/dist",
  "packages/cli/dist",
  "packages/template-orval/coverage",
  "packages/template-kubb/coverage",
  "packages/cli/coverage"
];
```

---

## 6️⃣ `vitest.config.ts`

✅ **Purpose:** Root test runner covering CLI and both templates.

```ts
export default defineConfig({
  test: {
    include: [
      "packages/template-orval/src/**/*.test.ts",
      "packages/template-kubb/src/**/*.test.ts",
      "packages/cli/src/**/*.test.ts"
    ]
  }
});
```

---

## 7️⃣ Template packages

- `packages/template-orval/`
  - Builds and publishes `@genxapi/template-orval`.
  - Exports `MultiClientConfigSchema` and `generateClients` for Orval.
  - Supports extended options: `httpClient`, `mock` object, cleaned outputs.
- `packages/template-kubb/`
  - Houses Kubb integration (`@genxapi/template-kubb`).
  - Accepts plugin overrides under `config.plugins` or `config.kubb` (merged into Kubb’s `plugin-client`, `plugin-ts`, `plugin-oas`).

Both templates ship with Rollup, TypeScript, Vitest, and mirror one another structurally for consistency.

---

## 8️⃣ CLI (`packages/cli/`)

Key updates:

- `loadCliConfig` recognises the unified schema. It transforms configs into the template-specific format when `project.template` is `"orval"` or `"kubb"`.
- New module `src/config/unified.ts` defines the Zod schema, mapping logic, and CLI overrides (`TemplateOverrides`).
- `generate` command accepts additional flags:

  | Flag | Purpose |
  |------|---------|
  | `--http-client` | Force axios or fetch across clients. |
  | `--client` | Override Orval runtime (react-query, swr, vue-query, etc.). |
  | `--mode` | Select Orval mode (split, split-tag, …). |
  | `--base-url` | Override base URL for every client. |
  | `--mock-type`, `--mock-delay`, `--mock-use-examples` | Control mock generation profile. |

- Overrides are applied via `applyTemplateOverrides` before invoking template `generateClients`.
- JSON schema (`schemas/genxapi.schema.json`) mirrors the unified Zod schema—editors gain IntelliSense by referencing it.

---

## 9️⃣ Docs & Context

- `docs/configuration/unified-generator-config.md` — detailed breakdown of the unified config, mapping tables for Orval/Kubb, CLI flag equivalents.
- `docs/templates/orval-api-client-template.md` and `docs/templates/kubb-api-client-template.md` — how to consume generated models (React Query hooks, MSW mocks, Kubb plugin outputs, etc.).
- `README.md`, `docs/context.md`, and `docs/scope.md` reference the renamed packages and unified interface.
- `.context/troubleshooting.md` includes guidance for git init issues and dependency conflicts (updated with orphan checkout fix and Kubb v4 upgrade).

---

## 🔚 Summary

The repo now standardises template naming, configuration, and documentation around a **unified orchestration layer**. All config (files, CLI flags, schema) funnels through the same interface, which is then mapped to the appropriate engine adapter. This keeps future templates pluggable while giving users a consistent workflow, regardless of whether they target Orval, Kubb, or custom generators.

---

## 1️⃣1️⃣ Example / Sample Output

We do not keep generated SDKs committed to the repo, but the sample configs plus template READMEs cover the previous “examples/sample-api” intent. To validate configuration and see log output without writing to disk:

```bash
node packages/cli/dist/index.js generate \
  --config samples/multi-client.config.json \
  --dry-run
```

Pair this with `--template kubb` or the unified overrides (`--http-client`, `--client`, `--mode`, etc.) to check the mapping logic.

---

## 1️⃣2️⃣ Tooling & Release Flow

| Command | Description |
|---------|-------------|
| `npm install` | Installs all workspaces (Node ≥ 24 recommended to avoid engine warnings). |
| `npm run build` | Builds both templates and the CLI via Rollup. |
| `npm test` | Runs Vitest suites across workspaces. |
| `npm run clean` | Removes `dist/` and `coverage/` artefacts. |
| `npm run npm-publish --workspace <pkg>` | Publishes a specific workspace (template or CLI). |
| `npx genxapi generate` | Generates clients, runs hooks, syncs GitHub, and honours npm publish settings. |
| `npx genxapi publish` | Uses Octokit to create GitHub releases (requires `GITHUB_TOKEN`). |

**Runtime note:** Orval 7.x bundles Commander 14 which officially targets Node 20+. Running generation on Node 18 works but prints engine warnings—encourage contributors to use Node ≥ 20 for a clean experience.

Security snapshot (2025‑10‑18):
- `npm audit` → **0 known vulnerabilities** after moving Orval to a peer dependency.
- Orval remains a consumer responsibility, preventing the vulnerable `validator` subtree from landing automatically.

---

## 🚀 Next Steps & Enhancements

- Consider relocating this file to `/docs` alongside diagrams that illustrate the generation flow.
- Provide additional config samples (hooks, remote swagger sources, skip install/generate scenarios).
- Add an `examples/` workspace that runs the CLI end-to-end for smoke testing.
- Automate release tagging / changelog generation (e.g. Changesets) building on the `publish` command.
- Before editing `/docs`, consult `.context/docs-upgrade-playbook.md` for style and structure guardrails.
