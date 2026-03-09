---
title: "Getting Started"
---

# Getting Started

Welcome to GenX API. The current release focuses on orchestration for contract-driven client and package generation. This guide walks through installation, configuration, and validating a first generation locally.

## Prerequisites

- Node.js **20 or newer**.
- A package manager (`npm`, `pnpm`, or `yarn`) installed on your machine.
- Optional: `GITHUB_TOKEN` and `NPM_TOKEN` environment variables if you plan to push commits or publish packages.

## Install the CLI

Choose the template you plan to drive and install it alongside the CLI:

```bash
# npm (Orval template)
npm install --save-dev @genxapi/cli @genxapi/template-orval

# npm (Kubb template)
npm install --save-dev @genxapi/cli @genxapi/template-kubb

# pnpm
pnpm add -D @genxapi/cli @genxapi/template-orval

# yarn
yarn add --dev @genxapi/cli @genxapi/template-orval

# One-off execution without a local install
npx genxapi --help
```

Recommended invocation paths:

- Local install in your project: `npx genxapi ...`
- One-off execution today: `npx genxapi ...`
- Direct package alternative: `npx @genxapi/cli ...`

The `genxapi` package is the primary alias for the command name. It forwards to the latest `@genxapi/cli`, while `@genxapi/cli` remains the direct installable package.

When contributing to this repository, bootstrap everything with:

```bash
npm install
npm run build
```

## Create a Configuration File

By default the CLI looks for config in the current working directory. Supported filenames today are:

- `genxapi.config.json`
- `genxapi.config.yaml`
- `genxapi.config.yml`
- `genxapi.config.ts`

Start with a minimal JSON config:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/genxapi/genxapi/main/packages/cli/schemas/genxapi.schema.json",
  "project": {
    "name": "petstore-sdk",
    "directory": "./sdk/petstore",
    "template": "orval",
    "output": "./src",
    "config": {
      "httpClient": "axios",
      "client": "react-query",
      "mock": { "type": "msw" },
    },
    "publish": {
      "npm": { "enabled": false },
    },
  },
  "clients": [
    {
      "name": "petstore",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": { "baseUrl": "https://api.petstore.local" },
    },
  ],
}
```

Prefer TypeScript? Export the config from `genxapi.config.ts`:

```ts
import type { UnifiedGeneratorConfig } from "@genxapi/cli";

const config: UnifiedGeneratorConfig = {
  project: {
    name: "petstore-sdk",
    directory: "./sdk/petstore",
    template: "orval",
    output: "./src",
    config: {
      httpClient: "axios",
      client: "react-query",
    },
  },
  clients: [
    {
      name: "petstore",
      swagger: "https://petstore3.swagger.io/api/v3/openapi.json",
    },
  ],
};

export default config;
```

> 💡 Tip: Keep the `$schema` reference in JSON config files or use the `UnifiedGeneratorConfig` type in TypeScript config files so editors can validate while you edit.

> ℹ️ In monorepos such as Nx, set `project.directory` to the workspace package path you want GenX API to scaffold, for example `libs/petstore-sdk` or `packages/petstore-sdk`.

### Selecting a template from the CLI

Prefer a one-off change? Pass `--template` to override the config without editing files:

```bash
npx genxapi generate --template kubb --log-level info
```

Aliases:

- `orval` → `@genxapi/template-orval` (default)
- `kubb` → `@genxapi/template-kubb`

### Switching to the Kubb template

Set `project.template` to `"kubb"` (or run with `--template kubb`) and provide plugin overrides via `config`:

```jsonc
{
  "project": {
    "name": "petstore-sdk",
    "directory": "./sdk/petstore",
    "template": "kubb",
    "config": {
      "httpClient": "fetch",
      "plugins": {
        "client": { "dataReturnType": "data" },
      },
    },
  },
  "clients": [
    {
      "name": "petstore",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": {
        "plugins": {
          "client": { "dataReturnType": "data" },
        },
      },
    },
  ],
}
```

## Run the First Generation

```bash
npx genxapi generate --log-level info
```

The CLI:

1. Scaffolds the TypeScript template into `project.directory`.
2. Resolves the selected template and maps unified config into it.
3. Runs the underlying generator for each client definition.
4. Executes configured hooks.
5. Optionally syncs GitHub changes and publishes packages if the config enables those post-generation steps.

Dry-run the process to validate configuration, resolve contracts, and inspect the planned outputs without modifying files:

```bash
npx genxapi generate --dry-run --plan-output ./artifacts/genxapi-plan.json
```

Export tokens to unlock automation:

```bash
export GITHUB_TOKEN=ghp_xxx   # repo + pull request permissions
export NPM_TOKEN=xxx          # automation or publish token
```

## Inspect the Generated Project

After a successful run your folder structure will look similar to:

```text
sdk/petstore/
├── package.json
├── README.md
├── rollup.config.mjs
├── tsconfig.json
├── tsconfig.build.json
├── swagger-spec.json
└── src/
    ├── client.ts
    ├── model/
    └── runtime/
```

Move into the generated project to run its scripts:

```bash
cd sdk/petstore
npm install
npm test
npm run build
```

Consumer applications should import the generated package boundary after it is built, not internal `src/` or `dist/` paths. For example:

```ts
import { pets } from "petstore-sdk";

const result = await pets.getPets();
```

> 📘 Note: If you set `project.runGenerate` to `false` the template is scaffolded but the underlying generator step is skipped. This is useful when you want to run the native generator yourself or inject a custom build step.

## Override the Output Directory

Use the `--target` flag to redirect `project.directory` without editing the config:

```bash
npx genxapi generate --target ./tmp/generated-clients
```

The CLI rewrites the directory relative to your configuration file and keeps paths consistent.

## Next Steps

- Continue with the [Configuration Reference →](./configuration.md) to explore every option.
- Read [Architecture boundaries →](./architecture/boundaries.md) before wiring generated packages into other repositories.
- Jump ahead to [CI Integration →](./ci-integration.md) when you are ready to automate the current workflow with the official GitHub Action or a headless CLI plan.
