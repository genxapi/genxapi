# Context

## Overview

GenX API is orchestration for contract-driven client and package generation. It coordinates configuration, template execution, package assembly, and optional post-generation workflow steps around a generated package.

## Current Architecture at a Glance

### Component boundaries

| Layer | Owned by GenX API | Delegated / external |
|-------|---------------------------------|----------------------|
| CLI, config discovery, command routing | ✅ | |
| Contract ownership | | 🧩 Backend teams and service repos |
| Schema parsing & SDK code generation | | 🧩 Template-provided engines (e.g. Orval, Kubb) |
| Template mapping and generated package shape | | 🧩 Template packages |
| Git automation (commits, PRs, releases) | ✅ orchestration | 🧩 GitHub / Octokit APIs |
| Package publishing (npm, private registries) | ✅ orchestration | 🧩 npm CLI / registry |
| CI execution environment | ✅ command design | 🧩 GitHub Actions, GitLab CI, CircleCI, etc. |
| Consumer application integration | | 🧩 Generated package consumers |

Read the concrete boundary rules in [Architecture boundaries](./architecture/boundaries.md).

### Orchestration flow

1. **Specification**: OpenAPI documents live alongside the codebase or are fetched from remote sources.
2. **Configuration**: `genxapi.config.json` or YAML declares clients, hooks, package metadata, and optional post-generation workflow settings.
3. **Generation**: The CLI invokes engine adapters declared by the selected templates to materialise SDKs into the workspace.
4. **Package boundary assembly**: The template exposes a stable package interface for consumers.
5. **Optional post-generation actions**: GitHub sync or registry publish can run when configured.
6. **Release**: The `publish` command can create a GitHub release when explicit metadata is supplied.

## Templates and generators

- **TypeScript template (Orval)**: the default adapter ships in-repo, targeting TypeScript SDK generation.
- **Kubb template**: ships in-repo and maps the unified config into Kubb plugin configuration.
- **Custom engines**: any executable generator (OpenAPI Generator, Autorest, bespoke code) can be plugged in via hooks or by extending the template folder.

All templates are treated as pluggable executors, letting teams add or swap generators without changing the orchestration layer.

## Configuration model

Configuration files follow the `genxapi.config` naming convention and are validated with the unified schema. A minimal example:

```json
{
  "$schema": "https://raw.githubusercontent.com/genxapi/genxapi/main/packages/cli/schemas/genxapi.schema.json",
  "logLevel": "info",
  "project": {
    "name": "billing-clients",
    "directory": "./sdk",
    "template": "orval",
    "output": "./src",
    "config": {
      "httpClient": "axios",
      "client": "react-query",
      "mode": "split",
      "mock": { "type": "msw", "useExamples": true }
    },
    "repository": {
      "owner": "acme",
      "name": "billing-clients",
      "pullRequest": {
        "branchPrefix": "chore/clients"
      }
    },
    "publish": {
      "npm": { "enabled": false }
    }
  },
  "clients": [
    {
      "name": "ledger",
      "swagger": "./specs/ledger.yaml",
      "config": { "baseUrl": "https://api.acme.internal" }
    },
    {
      "name": "analytics",
      "swagger": "https://api.acme.dev/analytics/openapi.json",
      "config": {
        "client": "swr",
        "mock": { "type": "off" }
      }
    }
  ]
}
```

Key capabilities:

- Multiple clients per configuration, each with bespoke overrides while sharing project-wide defaults.
- Template selection via `project.template` (`orval`, `kubb`, or a custom package).
- Optional hooks before/after generation for validation or bundling.
- Registry options for public or private npm scopes.
- Repository metadata (`owner`, `repo`, default branch) to enable optional GitHub sync after generation.

## Commands and workflows

### `generate`

- Discovers configuration, prepares template files, and invokes the generators declared by your templates.
- Supports `--dry-run` for safe CI validation.
- Accepts overrides such as `--template`, `--http-client`, `--client`, `--mode`, `--mock-type` which merge on top of the unified config.
- Can run post-generation GitHub sync or registry publish depending on config.

### `publish`

- Creates a GitHub release from explicit `--token`, `--owner`, `--repo`, and `--tag` values.
- Does not infer version bumps or contract change severity.

## Example end-to-end workflow

1. Backend publishes or updates the OpenAPI contract.
2. A developer or CI job runs `npx genxapi generate`.
3. The template regenerates the package and re-exports the stable package interface.
4. Optional GitHub sync or registry publish runs if configured.
5. A release workflow may call `npx genxapi publish` to create a GitHub release.

## Integration patterns

- **Monorepo**: Workspaces house generated clients; the orchestrator scaffolds packages into paths such as `packages/*` or `libs/*` and maintains consistent TypeScript config and tooling.
- **Polyrepo**: Use GitHub automation to open pull requests against downstream repositories after generation.
- **Hybrid**: Share configuration via git submodules or package registries; the CLI honours absolute paths and remote specs.

## Planned Later

Later phases are expected to cover:

- First-class contract diffing.
- SemVer or release intelligence driven by contract changes.
- Broader reporting and catalog surfaces.

## Further reading

- [Configuration reference](configuration.md)
- [Getting started](getting-started.md)
- [CI integration](ci-integration.md)
- [Templates & adapters](templates.md)
