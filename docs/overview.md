# Overview

`GenxAPI` automates the “client API generator” workflow without locking you to a single engine. It discovers OpenAPI-driven configs, runs the template of your choice (Orval, Kubb, or custom), enforces semantic versioning, and publishes packages through GitHub and npm.

## Why it exists

- Keep SDK generation, versioning, and releases aligned from one config file.
- Reuse your preferred generator instead of rewriting pipelines.
- Automate the repetitive parts of CI: run generator, diff specs, bump SemVer, open PRs, publish.

## What it does

- Discovers multi-client configs and invokes template-backed engines.
- Applies reusable templates, hooks, and post-processing to keep generated clients uniform.
- Calculates semantic version bumps from OpenAPI diffs and writes changelog metadata.
- Commits, pushes, raises PRs, creates GitHub releases, and publishes to npm.

## Quickstart

```bash
npm install --save-dev @genxapi/cli @genxapi/template-orval
npx genxapi generate --log-level info
npx genxapi publish --dry-run
```

Key flags: `--config`, `--template`, `--http-client`, `--mock-type`, `--target`, `--dry-run`.

## Templates

- **Orval template** — TypeScript + React Query defaults with MSW mocks and Rollup bundling.
- **Kubb template** — uses Kubb plug-ins for multiple runtimes.
- **Custom engines** — wire in additional generators via hooks or template options.

## CI-friendly

- Works headless in CI with Node 20+.
- Cache-aware installs and dry-runs to validate without writing files.
- Uses `GITHUB_TOKEN` and `NPM_TOKEN` to unlock PR + publish automation.

Next steps: read [Getting Started](./getting-started.md), then dive into [Configuration](./configuration.md) and [Templates](./templates.md).
