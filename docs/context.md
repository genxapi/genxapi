# Context

## Overview

GenX API is orchestration for API client generation that still behaves like a client API generator from the user’s perspective. It coordinates SDK delivery from OpenAPI specification through to packaged release artefacts: discovering configuration, delegating code generation to the engines defined by your templates, then managing versioning, Git automation, and registry publishing. Configuration is **unified** - you describe intent once (`httpClient`, `client`, `mode`, `mock`, plugin overrides) and the CLI maps it onto the selected template (`@genxapi/template-orval`, `@genxapi/template-kubb`, or a custom adapter).

## Architecture at a glance

### Component boundaries

| Layer | Owned by GenX API | Delegated / external |
|-------|---------------------------------|----------------------|
| CLI, config discovery, command routing | ✅ | |
| Schema parsing & SDK code generation | | 🧩 Template-provided engines (e.g. Orval, Kubb, OpenAPI Generator) |
| Templates, token replacement, post-processing | ✅ | 🧩 Generator-specific adapters |
| Diffing & semantic version inference | ✅ | |
| Git automation (commits, PRs, releases) | ✅ | 🧩 GitHub / Octokit APIs |
| Package publishing (npm, private registries) | ✅ | 🧩 npm CLI / registry |
| CI execution environment | ✅ command design | 🧩 GitHub Actions, GitLab CI, CircleCI, etc. |
| Runtime client behaviour | | ❌ out of scope |

### Orchestration flow

1. **Specification**: OpenAPI documents live alongside the codebase or are fetched from remote sources.
2. **Configuration**: `genxapi.config.{json,ts}` declares clients, hooks, package metadata, and publishing rules.
3. **Generation**: The CLI invokes engine adapters declared by the selected templates to materialise SDKs into the workspace.
4. **Verification**: `diff` reports breaking changes; hooks perform additional validation.
5. **Versioning & release**: Semantic version bumps are calculated, changelog notes prepared, Git commits and PRs created.
6. **Publishing**: npm (public or private) and GitHub releases are issued; artefacts can then be consumed downstream.

## Templates and generators

- **TypeScript template (Orval)**: the default adapter ships in-repo, targeting TypeScript SDK generation.
- **Language adapters (Kubb)**: optional packages expose Python, Go, .NET, and other stacks through the same orchestration flow.
- **Custom engines**: any executable generator (OpenAPI Generator, Autorest, bespoke code) can be plugged in via hooks or by extending the template folder.

All templates are treated as pluggable executors, letting teams add or swap generators without changing the orchestration layer.

## Configuration model

Configuration files follow the `genxapi.config` naming convention and are validated with the unified schema. A minimal example:

```json
{
  "$schema": "https://raw.githubusercontent.com/genxapi/genxapi/main/schemas/genxapi.schema.json",
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
- Repository metadata (`owner`, `repo`, default branch) to enable release automation.

## Commands and workflows

### `generate`

- Discovers configuration, prepares template files, and invokes the generators declared by your templates.
- Supports `--dry-run` for safe CI validation.
- Accepts overrides such as `--template`, `--http-client`, `--client`, `--mode`, `--mock-type` which merge on top of the unified config.
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

1. Developer updates an OpenAPI document and runs `npx genxapi diff --base main --head HEAD`.
2. If the diff output is acceptable, `npx genxapi generate` refreshes all affected clients and stages changes.
3. A CI job runs `generate` followed by `publish --dry-run` to verify credentials.
4. Once merged, a scheduled pipeline executes `publish` (with `GITHUB_TOKEN` and `NPM_TOKEN`) to cut releases and publish packages.

## Integration patterns

- **Monorepo**: Workspaces house generated clients; the orchestrator maintains consistent TypeScript config and tooling.
- **Polyrepo**: Use GitHub automation to open pull requests against downstream repositories after generation.
- **Hybrid**: Share configuration via git submodules or package registries; the CLI honours absolute paths and remote specs.

## Further reading

- [Configuration reference](configuration.md)
- [Getting started](getting-started.md)
- [CI integration](ci-integration.md)
- [Templates & adapters](templates.md)
