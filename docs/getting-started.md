---
title: "Getting Started"
---

# Getting Started

Kick off your API client automation journey in minutes. This guide walks through installation, configuration, and running your first generation.

## Prerequisites

- Node.js **20 or newer** (Orval and Commander target Node 20).
- `npm` (or `pnpm`, `yarn`, `bun` if you adapt commands).
- Access tokens for GitHub and npm if you plan to push commits or publish packages.

> ⚠️ Warning: Running on Node 18 works but prints engine warnings and may miss newer language features. Stick to Node ≥ 20 in CI/CD.

## Install the CLI

Install globally or use `npx`:

```bash
npm install --save-dev @eduardoac/generate-api-client
# or run without installing:
npx @eduardoac/generate-api-client --help
```

When working inside this repository, bootstrap everything with:

```bash
npm install
npm run build
```

## Create a Configuration File

The CLI looks for `api-client-generatorrc.{json,yaml}` by default. Start with the minimal config below:

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

> 💡 Tip: Add this file to your repository root so the CLI finds it automatically; no `--config` flag required.

## Run Your First Generation

```bash
npx @eduardoac/generate-api-client generate --log-level info
```

The generator performs the following steps:

1. Scaffolds the template into `project.directory`.
2. Copies OpenAPI specs locally (if `copySwagger` is `true`).
3. Passes each client configuration to Orval and writes the produced files.
4. Runs `hooks.beforeGenerate` and `hooks.afterGenerate` scripts if defined.
5. Optionally syncs with GitHub and publishes to npm based on `project.repository` and `project.publish`.

Export tokens to enable automation:

```bash
export GITHUB_TOKEN=ghp_xxx    # repo + pull request permissions
export NPM_TOKEN=xxx           # automation or publish token
```

Run with `--dry-run` to validate the configuration without touching the filesystem:

```bash
npx @eduardoac/generate-api-client generate --dry-run
```

## Override the Output Directory

Use `--target` to redirect the project output without editing the config file:

```bash
npx @eduardoac/generate-api-client generate \
  --target ./tmp/generated-clients \
  --log-level debug
```

The CLI adjusts `project.directory` relative to the configuration file automatically.

## Verify the Generated SDK

```bash
cd sdk/petstore
npm install
npm test
npm run build
```

Every generated project includes:

- A ready-to-run `package.json`.
- Orval-generated clients under `src/`.
- Template README files and lint/test scripts.

> 📘 Note: If you disable `project.runGenerate`, the template scaffolds without running Orval. Use this when orchestrating Orval manually in CI.

## Next Steps

- Continue to the [Configuration guide](./configuration.md) to learn every setting.
- Explore [CI Integration](./ci-integration.md) when you are ready to automate in pipelines.
