# GenX API

> Orchestration for contract-driven client and package generation.

GenX API sits between your API contract and your generated package. It loads OpenAPI-driven configuration, delegates generator-specific work to templates, and coordinates shared lifecycle concerns such as scaffolding, hooks, repository sync, and optional registry publishing.

> Configuration files can be JSON, YAML, or TypeScript: `genxapi.config.json`, `genxapi.config.yaml`, `genxapi.config.yml`, or `genxapi.config.ts`.

## Product Boundaries

- Backend boundary: OpenAPI or Swagger contract.
- Consumer boundary: generated package interface.
- Template boundary: Orval, Kubb, or a custom template package own generator-specific behaviour.
- Core boundary: GenX API owns orchestration, lifecycle, metadata, and shared workflow concerns.

Read the full boundary definition in [docs/architecture/boundaries.md](docs/architecture/boundaries.md).

## Current Capabilities

- Run multi-client generation from one config file.
- Delegate generation through first-party Orval and Kubb templates, or a custom template package.
- Scaffold generated packages into monorepo-friendly directories via `project.directory` and per-client outputs.
- Apply shared overrides such as `--template`, `--http-client`, `--client`, `--mode`, and `--mock-*`.
- Resolve local or remote contracts into reproducible generation inputs with optional snapshots, checksums, and manifest output.
- Scaffold package files and stable package entrypoints for generated SDKs.
- Run hooks plus optional post-generation GitHub sync and npm or GitHub Packages publish steps when configured.
- Create a GitHub release with the `publish` command.

## Planned Capabilities

These are intentionally not described as shipped today:

- First-class `diff` command and contract change reporting.
- Diff-driven SemVer advice or release intelligence.
- Marketplace or catalog features.
- Broader reporting and CI intelligence beyond the current CLI workflow.

The roadmap remains visible in [docs/next-steps.md](docs/next-steps.md).

## Command Surface

The shipped CLI currently exposes two commands:

| Command | What it does today |
| ------- | ------------------ |
| `generate` | Loads config, resolves the template, generates clients, and may run post-generation GitHub or registry actions when configured. |
| `publish` | Creates a GitHub release for an explicit `owner` / `repo` / `tag`. |

There is no public `diff` command in the current CLI contract.

## CLI Invocation

Recommended repeatable setup for a project:

```bash
npm install --save-dev @genxapi/cli @genxapi/template-orval
npx genxapi generate --log-level info
```

Recommended one-off invocation path today:

```bash
npx genxapi generate --log-level info
```

Notes:

- `genxapi` is the primary human-facing command name.
- One-off `npx genxapi ...` uses the `genxapi` package, which forwards to the latest `@genxapi/cli`.
- Local installs still use `@genxapi/cli`, whose binary is also named `genxapi`.
- If you want to call the underlying package explicitly, `npx @genxapi/cli ...` remains supported.

## Quickstart

Start from the bundled Orval sample:

```bash
cp samples/orval-multi-client.config.json ./genxapi.config.json
npx genxapi generate --config ./genxapi.config.json --log-level info
```

Minimal config:

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
      "mock": { "type": "msw" }
    },
    "publish": {
      "npm": { "enabled": false }
    }
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json"
    }
  ],
  "hooks": {
    "beforeGenerate": [],
    "afterGenerate": []
  }
}
```

Useful commands:

```bash
# Validate config without writing files
npx genxapi generate --config ./genxapi.config.json --dry-run

# Switch templates or generator-facing options for a single run
npx genxapi generate \
  --config ./genxapi.config.json \
  --template kubb \
  --http-client fetch \
  --mode split-tag
```

## Reproducible Contract Workflows

`clients[].swagger` remains the shorthand for a contract source. Use `clients[].contract` when you need explicit snapshotting, checksums, or authenticated remote fetches.

```jsonc
{
  "clients": [
    {
      "name": "pets",
      "contract": {
        "source": "https://api.example.com/openapi.json",
        "auth": {
          "type": "bearer",
          "tokenEnv": "OPENAPI_TOKEN"
        },
        "snapshot": {
          "path": ".genxapi/contracts/pets.json"
        },
        "checksum": true
      }
    }
  ]
}
```

Secure usage expectations:

- Keep secrets in environment variables referenced by `contract.auth.*Env`; do not embed tokens in config files or URLs.
- Prefer snapshotting remote contracts so generation runs against a fixed file instead of a mutable live endpoint.
- Inspect `genxapi.manifest.json` after generation for the resolved contract source, checksum, output paths, template, and generation timestamp.

Generated packages now separate lifecycle scripts explicitly:

- `npm run generate` regenerates source from the resolved contract inputs.
- `npm run build` bundles the already generated source and does not rerun generation.
- `npm run publish` builds and publishes without implicitly fetching contracts again.

## Current vs Planned Release Workflow

Current:

- `project.publish.npm` and `project.publish.github` are post-generation publish settings used by `generate`.
- `genxapi publish` creates a GitHub release when you pass `--token`, `--owner`, `--repo`, and `--tag`.
- The root `npm run publish -- ...` helper is a repository maintenance script for this monorepo, not part of the product CLI surface.

Planned:

- Contract diffing, SemVer inference, and richer release intelligence are future phases.

## CI Example

```yaml
name: Refresh SDKs

on:
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx genxapi generate --config ./genxapi.config.json --log-level info
```

If you want contract diff gates today, add your own external diff step or hook. A first-class GenX API `diff` command is planned, not shipped.

## Try the Bundled Samples

```bash
npx genxapi generate \
  --config samples/orval-multi-client.config.json \
  --log-level info

npx genxapi generate \
  --config samples/kubb-multi-client.config.json \
  --log-level info
```

## Further Reading

- [Getting Started](docs/getting-started.md)
- [Architecture boundaries](docs/architecture/boundaries.md)
- [Unified configuration](docs/configuration/unified-generator-config.md)
- [Generation manifest](docs/generation-manifest.md)
- [Templates](docs/templates.md)
- [CI integration](docs/ci-integration.md)
- [Versioning and releases](docs/versioning.md)
- [Roadmap](docs/next-steps.md)

## Template Packages

- **Orval template (`@genxapi/template-orval`)** — the default adapter for TypeScript + React Query workflows. [Usage guide](docs/templates/orval-api-client-template.md).
- **Kubb template (`@genxapi/template-kubb`)** — exposes the Kubb plugin ecosystem for multi-language SDKs. [Usage guide](docs/templates/kubb-api-client-template.md).
- **Custom engines** — wire in additional generators by extending templates or invoking them from lifecycle hooks.

Templates are versioned alongside the orchestrator so teams can upgrade the workflow without rewriting scripts.

## Licence

This project is licensed under the Apache License 2.0.

See the [LICENSE](./LICENSE) file for details.

Copyright 2025-2026 Eduardo Aparicio Cardenes.
