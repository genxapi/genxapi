---
title: "CI Integration"
---

# CI Integration

GenX API now ships an official automation surface for backend-triggered package generation:

- the `generate` command can run headless dry-run planning with a JSON plan file
- the repository root ships an official GitHub Action
- the action exposes a stable set of CI inputs and outputs
- dry runs now resolve contracts, template choice, output paths, and planned lifecycle actions before any files are written

This keeps the boundaries narrow:

- backend boundary: your OpenAPI or Swagger contract
- consumer boundary: the generated package interface
- template boundary: Orval or Kubb still own generator-specific capability behavior
- core boundary: GenX API owns orchestration, metadata, lifecycle, and workflow reporting

## Official GitHub Action

Use the repository root action in GitHub Actions:

```yaml
- name: Run GenX API
  id: genx
  uses: genxapi/genxapi@main
  with:
    config: ./genxapi.config.json
    contract: ./openapi/petstore.yaml
    output-path: ./sdk/petstore-sdk
    dry-run: false
```

Use a tagged release instead of `@main` once you standardise the version you want to pin in CI.

### Supported inputs

| Input               | Meaning                                                                           | Default                     |
| ------------------- | --------------------------------------------------------------------------------- | --------------------------- |
| `config`            | Path to the GenX API config file.                                                 | `genxapi.config.json`       |
| `contract`          | Optional contract path or URL override for single-client configs.                 | empty                       |
| `output-path`       | Optional generated project directory override.                                    | empty                       |
| `publish-mode`      | Publish override: `config`, `off`, `npm`, `github`, or `both`.                    | `config`                    |
| `dry-run`           | Validate and emit a plan without writing generated files.                         | `false`                     |
| `contract-version`  | Optional external contract version string recorded in plan and manifest metadata. | empty                       |
| `plan-output`       | Optional JSON plan output path.                                                   | runner temp path            |
| `log-level`         | CLI logging level.                                                                | `info`                      |
| `working-directory` | Working directory that contains the config file.                                  | `.`                         |
| `node-version`      | Node.js version used by the action.                                               | `22`                        |
| `cli-version`       | Optional `@genxapi/cli` version override.                                         | action repo package version |

### Action outputs

| Output                       | Meaning                                               |
| ---------------------------- | ----------------------------------------------------- |
| `dry-run`                    | Whether the run executed in dry-run mode.             |
| `plan-path`                  | Absolute path to the generated JSON plan file.        |
| `manifest-path`              | Planned manifest path inside the generated package.   |
| `template-name`              | Resolved template package name.                       |
| `template-kind`              | Resolved template kind.                               |
| `project-name`               | Generated package name.                               |
| `project-directory`          | Generated package directory from the resolved run.    |
| `contract-version`           | External contract version metadata for the run.       |
| `contracts-json`             | JSON summary of resolved contract sources per client. |
| `outputs-json`               | JSON summary of resolved output paths per client.     |
| `planned-actions-json`       | JSON summary of planned GenX API lifecycle actions.   |
| `selected-capabilities-json` | JSON array of selected template capabilities.         |

## Backend-Initiated Example

Reference workflow: [docs/backend-package-generation.workflow.yml](./backend-package-generation.workflow.yml)

```yaml
name: Backend Package Generation

on:
  pull_request:
    paths:
      - openapi/**/*
      - genxapi.config.json
  push:
    branches:
      - main
    paths:
      - openapi/**/*
      - genxapi.config.json

jobs:
  generate-sdk:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4
      - id: genx
        uses: genxapi/genxapi@main
        with:
          config: ./genxapi.config.json
          contract: ./openapi/petstore.yaml
          output-path: ./sdk/petstore-sdk
          contract-version: ${{ github.sha }}
          dry-run: ${{ github.event_name == 'pull_request' }}
          publish-mode: ${{ github.ref == 'refs/heads/main' && 'config' || 'off' }}
      - name: Show resolved plan
        run: |
          echo '${{ steps.genx.outputs.contracts-json }}'
          echo '${{ steps.genx.outputs.outputs-json }}'
          echo '${{ steps.genx.outputs.planned-actions-json }}'
```

Why this is the intended backend flow:

- the workflow starts from the backend-owned contract file
- the only GenX API inputs are the config file plus optional automation overrides
- the generated package boundary remains the package directory, not internal generator output paths
- publish behavior stays opt-in and config-driven unless CI explicitly overrides it

## Headless Dry Run and Plan Output

`generate --dry-run` now resolves enough of the run to be trustworthy in CI:

- template kind and template package
- contract source and generator input
- output workspace, target, and schema paths
- planned GenX API actions such as manifest writing, repository sync, and publish steps
- selected template capabilities and dependency plan

Example:

```bash
npx genxapi generate \
  --config ./genxapi.config.json \
  --dry-run \
  --plan-output ./artifacts/genxapi-plan.json \
  --contract ./openapi/petstore.yaml \
  --output-path ./sdk/petstore-sdk
```

The JSON plan file is the recommended CI hand-off artifact before you allow generation or publishing.

## CLI Automation Overrides

The supported CI-facing `generate` overrides are intentionally small:

- `--contract` overrides the contract source for a single-client config
- `--output-path` overrides the generated package directory
- `--publish-mode` flips publish automation between `config`, `off`, `npm`, `github`, and `both`
- `--contract-version` records external contract version metadata in the plan and manifest
- `--plan-output` writes a JSON plan file for CI parsing

These flags do not collapse template behavior into the shared automation surface. They only control orchestration inputs that belong in GenX API core.

## Logging and Failure Behavior

Headless runs are now clearer by default:

- dry runs print a real generation plan instead of exiting after config validation
- CI mode avoids spinner-only progress reporting
- contract URLs are sanitised before they are echoed in plan and manifest metadata
- top-level CLI failures pass through secret redaction before they hit stderr

Operational guidance:

- keep tokens in environment variables referenced by config, never inline in URLs
- use `publish-mode: off` on pull requests so validation stays side-effect free
- promote to `publish-mode: config` or a narrower explicit mode only on protected branches

## Direct CLI Usage

If you do not want to use GitHub Actions, the same surface is available directly:

```bash
npx genxapi generate \
  --config ./genxapi.config.json \
  --contract ./openapi/petstore.yaml \
  --output-path ./sdk/petstore-sdk \
  --publish-mode off \
  --dry-run \
  --plan-output ./artifacts/genxapi-plan.json
```

This is the supported path for other CI providers as well.

## What Is Still Not Shipped

This phase does not add:

- first-class diff or release classification
- template flattening between Orval and Kubb
- consumer-repo coupling or dist-path based automation

Those stay in later phases.

## Next Steps

- Read [Generation Manifest](./generation-manifest.md) for the metadata produced after a real run.
- Read [Versioning and releases](./versioning.md) for the current publish and release surface.

---

**Next:** [Templates →](./templates.md)
