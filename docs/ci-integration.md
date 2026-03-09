---
title: "CI Integration"
---

# CI Integration

GenX API stays CLI-first in automation:

- the `generate` command can run headless dry-run planning with a JSON plan file
- the `diff` command can produce contract comparison output for humans or automation
- direct CLI execution works in GitHub Actions and other CI systems
- the official GitHub Action wrapper lives in the separate `genxapi-action` repository
- dry runs resolve contracts, template choice, output paths, planned lifecycle actions, and next-step reporting before any files are written

This keeps the boundaries narrow:

- backend boundary: your OpenAPI or Swagger contract
- consumer boundary: the generated package interface
- template boundary: Orval or Kubb still own generator-specific capability behavior
- core boundary: GenX API owns orchestration, metadata, lifecycle, and workflow reporting

## Choose your automation path

- Use the CLI directly when you want the most flexible path, need custom install or pinning control, or want the same automation pattern across GitHub Actions, GitLab CI, CircleCI, and local runners.
- Use the official GitHub Action when your automation already lives in GitHub Actions and you want the thinnest workflow wrapper.

See [Official GitHub Action](./github-action.md) for the wrapper repository and migration note.

## GitHub Actions with direct CLI usage

This repository documents the CLI-first flow. A GitHub Actions workflow can call the CLI directly:

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
    env:
      GENXAPI_VERSION: 0.2.0
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Run GenX API
        shell: bash
        run: |
          set -euo pipefail

          args=(
            generate
            --config ./genxapi.config.json
            --contract ./openapi/petstore.yaml
            --output-path ./sdk/petstore-sdk
            --contract-version "${GITHUB_SHA}"
            --plan-output ./artifacts/genxapi-plan.json
            --release-manifest-output ./artifacts/genxapi-release.json
            --publish-mode "${{ github.ref == 'refs/heads/main' && 'config' || 'off' }}"
          )

          if [ "${{ github.event_name }}" = "pull_request" ]; then
            args+=(--dry-run)
          fi

          npx -y "@genxapi/cli@${GENXAPI_VERSION}" "${args[@]}"
```

If you want the GitHub-specific wrapper instead of direct CLI wiring, use the official `genxapi-action` repository described in [Official GitHub Action](./github-action.md).

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
    env:
      GENXAPI_VERSION: 0.2.0
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Plan or generate the package
        shell: bash
        run: |
          set -euo pipefail

          args=(
            generate
            --config ./genxapi.config.json
            --contract ./openapi/petstore.yaml
            --output-path ./sdk/petstore-sdk
            --contract-version "${GITHUB_SHA}"
            --plan-output ./artifacts/genxapi-plan.json
            --release-manifest-output ./artifacts/genxapi-release.json
            --publish-mode "${{ github.ref == 'refs/heads/main' && 'config' || 'off' }}"
          )

          if [ "${{ github.event_name }}" = "pull_request" ]; then
            args+=(--dry-run)
          fi

          npx -y "@genxapi/cli@${GENXAPI_VERSION}" "${args[@]}"
      - name: Show resolved plan
        run: |
          cat ./artifacts/genxapi-plan.json
          if [ -f ./artifacts/genxapi-release.json ]; then
            cat ./artifacts/genxapi-release.json
          fi
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
npx genxapi diff \
  --base ./openapi/petstore-before.yaml \
  --head ./openapi/petstore-after.yaml \
  --format json \
  --output ./artifacts/genxapi-diff.json \
  --release-manifest-output ./artifacts/genxapi-release.json

npx genxapi generate \
  --config ./genxapi.config.json \
  --dry-run \
  --plan-output ./artifacts/genxapi-plan.json \
  --release-manifest-output ./artifacts/genxapi-release.json \
  --contract ./openapi/petstore.yaml \
  --output-path ./sdk/petstore-sdk
```

The JSON plan file is the recommended CI hand-off artifact before you allow generation or publishing. The release manifest is the recommended place to join contract diff output and generation metadata into one CI artifact.

## CLI Automation Overrides

The supported CI-facing `generate` overrides are intentionally small:

- `--contract` overrides the contract source for a single-client config
- `--output-path` overrides the generated package directory
- `--publish-mode` flips publish automation between `config`, `off`, `npm`, `github`, and `both`
- `--contract-version` records external contract version metadata in the plan and manifest
- `--plan-output` writes a JSON plan file for CI parsing
- `--release-manifest-output` writes release lifecycle metadata that can be shared with `genxapi diff`

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
  --plan-output ./artifacts/genxapi-plan.json \
  --release-manifest-output ./artifacts/genxapi-release.json
```

This is the supported path for other CI providers as well.

## Migration note

Earlier versions of this documentation referenced a repository-root GitHub Action in `genxapi`. That wrapper now lives in `genxapi-action`.

Keep using the same GenX API config, CLI flags, manifests, and diff flow. Only the GitHub Actions wrapper source moves to the dedicated action repository.

## What Is Still Not Shipped

This phase still does not add:

- breaking vs non-breaking structural diffing
- automatic SemVer decisions or release-note generation
- template flattening between Orval and Kubb
- consumer-repo coupling or dist-path based automation

Those stay in later phases.

## Next Steps

- Read [Generation Manifest](./generation-manifest.md) for the metadata produced after a real run.
- Read [Versioning and releases](./versioning.md) for the current publish and release surface.
- Read [Release lifecycle](./release-lifecycle.md) for the current diff-to-generation handoff.
- Read [Official GitHub Action](./github-action.md) when you want the dedicated GitHub wrapper repository.

---

**Next:** [Templates →](./templates.md)
