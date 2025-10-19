---
title: "Getting Started"
---

# Getting Started

Welcome to `client-api-generator`. In a few commands you can turn an OpenAPI specification into a versioned SDK that ships through your CI/CD pipeline. This guide walks through installation, configuration, and validating the first generation locally.

## Prerequisites

- Node.js **20 or newer** (Orval and Commander target Node 20).
- A package manager (`npm`, `pnpm`, or `yarn`) installed on your machine.
- Optional: `GITHUB_TOKEN` and `NPM_TOKEN` environment variables if you plan to push commits or publish packages.

> ⚠️ Warning: Node 18 can execute the CLI but emits engine warnings from dependencies. Use Node 20+ for production pipelines.

## Install the CLI

Choose your preferred workflow (install the CLI plus the template package you plan to use):

```bash
# npm (Orval template)
npm install --save-dev client-api-generator @eduardoac/api-client-template

# npm (Kubb template)
npm install --save-dev client-api-generator @eduardoac/kubb-client-template

# pnpm
pnpm add -D client-api-generator @eduardoac/api-client-template

# yarn
yarn add --dev client-api-generator @eduardoac/api-client-template

# Try it instantly
npx client-api-generator --help
```

> ℹ️  The Orval template remains the default. Swap `@eduardoac/api-client-template` for `@eduardoac/kubb-client-template` (and ensure Node 20+) when you prefer Kubb’s plug-in ecosystem, or pass `--template kubb` to the CLI for a one-off switch.

When contributing to this repository, bootstrap everything with:

```bash
npm install
npm run build
```

## Create a Configuration File

By default the CLI looks for `api-client-generatorrc.json` or `api-client-generatorrc.ts` in the current working directory. Start with a minimal JSON config:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/eduardoac/api-clients/main/schemas/generate-api-client.schema.json",
  "project": {
    "name": "petstore-sdk",
    "directory": "./sdk/petstore",
    "template": {
      "name": "@eduardoac/api-client-template"
    },
    "publish": {
      "npm": {
        "enabled": false
      }
    }
  },
  "clients": [
    {
      "name": "petstore",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "output": {
        "workspace": "./src",
        "target": "./src/client.ts"
      }
    }
  ]
}
```

Prefer TypeScript? Export the config from `api-client-generatorrc.ts`:

```ts
import type { CliConfig } from "client-api-generator/config";

const config: CliConfig = {
  project: {
    name: "petstore-sdk",
    directory: "./sdk/petstore",
    template: {
      name: "@eduardoac/api-client-template"
    }
  },
  clients: [
    {
      name: "petstore",
      swagger: "https://petstore3.swagger.io/api/v3/openapi.json",
      output: {
        workspace: "./src",
        target: "./src/client.ts"
      }
    }
  ]
};

export default config;
```

> 💡 Tip: Keep the `$schema` reference (for JSON) or TypeScript import (for TS) so editors provide IntelliSense and validation while you edit.

### Selecting a template from the CLI

Prefer a one-off change? Pass `--template` to override the config without editing files:

```bash
npx client-api-generator generate --template kubb --log-level info
```

Aliases:

- `orval` → `@eduardoac/api-client-template` (default)
- `kubb` → `@eduardoac/kubb-client-template`

### Switching to the Kubb template

Point `project.template.name` at the Kubb package (or run `--template kubb`) and optional Kubb-specific options become available under each client:

```jsonc
{
  "project": {
    "name": "petstore-sdk",
    "directory": "./sdk/petstore",
    "template": {
      "name": "@eduardoac/kubb-client-template"
    }
  },
  "clients": [
    {
      "name": "petstore",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "output": {
        "workspace": "./src",
        "target": "./src/client.ts"
      },
      "kubb": {
        "client": {
          "client": "fetch",
          "dataReturnType": "data"
        }
      }
    }
  ]
}
```

## Run the First Generation

```bash
npx client-api-generator generate --log-level info
```

The CLI:

1. Scaffolds the TypeScript template into `project.directory`.
2. Copies the OpenAPI document to the `swaggerCopyTarget`.
3. Runs Orval for each client definition.
4. Executes configured hooks.
5. Optionally syncs commits/pull requests and publishes packages if environment variables are present.

Dry-run the process to validate configuration without modifying files:

```bash
npx client-api-generator generate --dry-run
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

> 📘 Note: If you set `project.runGenerate` to `false` the template is scaffolded but Orval is skipped. This is useful when you want to run Orval yourself or inject a custom build step.

## Override the Output Directory

Use the `--target` flag to redirect `project.directory` without editing the config:

```bash
npx client-api-generator generate --target ./tmp/generated-clients
```

The CLI rewrites the directory relative to your configuration file and keeps paths consistent.

## Next Steps

- Continue with the [Configuration Reference →](./configuration.md) to explore every option.
- Jump ahead to [CI Integration →](./ci-integration.md) when you are ready to automate the workflow in pipelines.
