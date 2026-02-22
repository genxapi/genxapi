# GenX API Overview

GenX API is orchestration for API client generation. It discovers OpenAPI-driven configs, runs the template of your choice (Orval, Kubb, or custom), enforces semantic versioning, and publishes packages through GitHub and npm.

## What GenX API is

GenX API is orchestration for API client generation that keeps specs, generators, packaging, and releases aligned.

### Capabilities

- Orchestrates API client generation workflows from a unified config.
- Supports generator-driven client creation via templates (Orval, Kubb, or custom).
- Produces ready-to-consume client packages/projects.
- Automates GitHub and npm workflows where configured.
- Aligns releases with semantic diffing and versioning.

### Benefits

- Continuous alignment between APIs and clients.
- Faster delivery cycles with fewer handoffs.
- Reduced release coordination friction.
- Better traceability and auditability.
- Developer autonomy with confidence for consumers.

## Why it exists

Manual duplication across specs, SDKs, and releases slows teams down. API client generation helps, packaging helps, but coordination still creates friction. GenX API adds orchestration to shift left on API client generation so automation keeps clients and releases aligned.

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
