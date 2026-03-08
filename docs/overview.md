# GenX API Overview

GenX API is an orchestration layer for contract-driven client and package generation. It reads OpenAPI-driven configuration, hands generator-specific work to templates, and coordinates shared lifecycle tasks around the generated package.

## Current Capabilities

- Unified config for multi-client generation.
- First-party Orval and Kubb templates, plus custom template package support.
- Workspace and package scaffolding for monorepos, including Nx-style repository layouts.
- Generation-time hooks and package scaffolding.
- Optional post-generation GitHub sync and npm or GitHub Packages publish steps.
- A `publish` command that creates a GitHub release when you pass explicit release metadata.

## Planned Capabilities

These are planned, not shipped in the current CLI surface:

- First-class OpenAPI diffing.
- Diff-driven SemVer or release intelligence.
- Marketplace-style discovery or broader reporting surfaces.

## Boundaries

- Backend boundary: OpenAPI or Swagger contract.
- Consumer boundary: generated package interface.
- Template boundary: generator-specific mapping and artefacts.
- Core boundary: orchestration, lifecycle, metadata, and shared workflow concerns.

Read the full boundary document in [Architecture boundaries](./architecture/boundaries.md).

## Current CLI Usage

For repeatable project setup:

```bash
npm install --save-dev @genxapi/cli @genxapi/template-orval
npx genxapi generate --log-level info
```

For one-off execution without a local install:

```bash
npx genxapi generate --log-level info
```

The shipped command surface is currently:

- `generate`
- `publish`

`genxapi` is the primary command alias; `@genxapi/cli` remains the direct package alternative.

There is no public `diff` command today.

## Templates

- **Orval template**: package scaffolding plus Orval-specific client, mock, and bundling behaviour.
- **Kubb template**: package scaffolding plus Kubb plugin configuration and output assembly.
- **Custom templates**: packages that export the same template surface and keep generator-specific richness on the template side.

Next steps: read [Getting Started](./getting-started.md), then [Configuration](./configuration.md), [Templates](./templates.md), and [Next steps](./next-steps.md).
