# Context

## Overview

`client-api-generator` is a meta-orchestrator that coordinates SDK delivery from OpenAPI specification through to packaged release artefacts. It discovers configuration, delegates code generation to Orval, Kubb, or any other generator you register, then manages versioning, Git automation, and registry publishing. The goal is to replace hand-rolled scripts with a repeatable, configuration-driven workflow that runs the same way on a laptop or in CI.

## Architecture at a glance

### Component boundaries

| Layer | Owned by `client-api-generator` | Delegated / external |
|-------|---------------------------------|----------------------|
| CLI, config discovery, command routing | ✅ | |
| Schema parsing & SDK code generation | | 🧩 Orval, Kubb (and future engines) |
| Templates, token replacement, post-processing | ✅ | 🧩 Generator-specific adapters |
| Diffing & semantic version inference | ✅ | |
| Git automation (commits, PRs, releases) | ✅ | 🧩 GitHub / Octokit APIs |
| Package publishing (npm, private registries) | ✅ | 🧩 npm CLI / registry |
| CI execution environment | ✅ command design | 🧩 GitHub Actions, GitLab CI, CircleCI, etc. |
| Runtime client behaviour | | ❌ out of scope |

### Orchestration flow

1. **Specification** — OpenAPI documents live alongside the codebase or are fetched from remote sources.
2. **Configuration** — `api-client-generatorrc.{json,ts}` declares clients, hooks, package metadata, and publishing rules.
3. **Generation** — The CLI invokes Orval, Kubb, or additional executors to materialise SDKs into the template workspace.
4. **Verification** — `diff` reports breaking changes; hooks perform additional validation.
5. **Versioning & release** — Semantic version bumps are calculated, changelog notes prepared, Git commits and PRs created.
6. **Publishing** — npm (public or private) and GitHub releases are issued; artefacts can then be consumed downstream.

## Underlying generators

- **Orval** provides the default TypeScript template layer and CLI entry used by the orchestrator.
- **Kubb** can be enabled for language adapters such as Python, Go, or .NET.
- **Additional engines**—any executable generator (OpenAPI Generator, Autorest, bespoke scripts) can be connected through hooks or adapters.
- The orchestrator treats every generator as a pluggable executor, so future support can be added without rewriting workflows.

## Configuration model

Configuration files follow the `api-client-generatorrc` naming convention and are validated with Zod schemas. A minimal example:

```json
{
  "$schema": "./node_modules/client-api-generator/schemas/generate-api-client.schema.json",
  "project": {
    "name": "billing-clients",
    "directory": "./sdk",
    "packageManager": "npm"
  },
  "clients": [
    {
      "name": "ledger",
      "swagger": "./specs/ledger.yaml",
      "output": {
        "workspace": "./packages/ledger",
        "target": "./packages/ledger/src/client.ts"
      },
      "hooks": {
        "postGenerate": ["npm run lint --workspace ledger"]
      },
      "publish": {
        "npm": {
          "access": "restricted"
        }
      }
    }
  ]
}
```

Key capabilities:

- Multiple clients per configuration, each with bespoke generator inputs and publishing settings.
- Optional hooks before/after generation for validation or custom bundling.
- Registry options for public or private npm scopes.
- Repository metadata (`owner`, `repo`, default branch) to enable release automation.

## Commands and workflows

### `generate`

- Discovers configuration, prepares template files, and calls Orval, Kubb, or your configured generators.
- Supports `--dry-run` for safe CI validation.
- Writes Git-ready changes without forcing a commit, allowing further review.

### `diff`

- Compares two OpenAPI documents (local paths, URLs, or Git refs).
- Labels breaking, potentially breaking, and safe changes.
- Emits JSON or human-readable output that can gate CI.

### `publish`

- Applies semantic version rules derived from `diff`.
- Creates Git tags, GitHub releases, and optional changelog entries.
- Publishes all generated packages to npm using the configured access level.

## Example end-to-end workflow

1. Developer updates an OpenAPI document and runs `npx client-api-generator diff --base main --head HEAD`.
2. If the diff output is acceptable, `npx client-api-generator generate` refreshes all affected clients and stages changes.
3. A CI job runs `generate` followed by `publish --dry-run` to verify credentials.
4. Once merged, a scheduled pipeline executes `publish` (with `GITHUB_TOKEN` and `NPM_TOKEN`) to cut releases and publish packages.

## Integration patterns

- **Monorepo** — Workspaces house generated clients; the orchestrator maintains consistent TypeScript config and tooling.
- **Polyrepo** — Use GitHub automation to open pull requests against downstream repositories after generation.
- **Hybrid** — Share configuration via git submodules or package registries; the CLI honours absolute paths and remote specs.

## Further reading

- [Configuration reference](configuration.md)
- [Getting started](getting-started.md)
- [CI integration](ci-integration.md)
- [Templates & adapters](templates.md)
