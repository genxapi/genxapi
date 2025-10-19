# Scope

## Core intent

We are building a **meta-orchestrator** for API client generation that unifies how SDKs are produced, validated, versioned, and published. It co-ordinates generation engines under consistent configuration, CI logic, and release workflows.

This project does **not** replace Orval or Kubb. Instead, it acts as the conductor that executes multiple generation engines with shared guardrails.

## Capabilities

### Generation orchestration

- Uses Orval (and optionally Kubb) to generate SDKs from OpenAPI schemas.
- Supports multiple clients within a monorepo or spread across repositories.
- Handles configuration discovery (`api-client-generatorrc.*`) and per-client overrides.

### CI/CD integration

- Runs commands in headless mode for pipelines.
- Integrates with GitHub Actions and other CI workflows to regenerate and publish SDKs automatically.
- Triggers GitHub commits, pull requests, and releases after generation.
- Derives semantic versioning decisions from OpenAPI diffs.

### Templating & configuration management

- Provides reusable templates for consistent SDK scaffolding (package manifests, TypeScript configs, bundler settings, etc.).
- Supports local and remote config schemas validated via Zod.
- Centralises configuration so every SDK follows the same rules.

### Publishing

- Automates release creation and npm publishing through Octokit and npm APIs.
- Supports private and public registries.
- Manages authentication (`GITHUB_TOKEN`, `NPM_TOKEN`) for CI/CD environments.

### Developer experience

- Ships a unified CLI (`generate`, `publish`, `diff`).
- Offers logging, dry-runs, validation, and hooks for custom workflows.
- Encourages shift-left testing and validation of API contracts.

## Explicit non-goals

- ❌ Replace Orval, Kubb, or other code generation engines.
- ❌ Parse OpenAPI schemas or emit client code directly.
- ❌ Provide runtime SDK layers or HTTP clients.
- ❌ Deliver a web dashboard or graphical interface.
- ❌ Deploy or host generated SDKs beyond packaging and publishing.
- ❌ Hard-code generator-specific logic that prevents future extensibility.

## Core boundaries

| Layer | Owned by this project | Delegated / external |
|-------|-----------------------|----------------------|
| CLI & orchestration | ✅ | |
| Schema parsing / SDK codegen | | 🧩 Orval / Kubb |
| Templates & project scaffolding | ✅ | 🧩 Generator-specific artefacts |
| Diff & semantic versioning | ✅ | |
| Publishing (GitHub / npm) | ✅ | |
| Pipeline execution (CI) | ✅ command layer | 🧩 CI runners |
| Runtime SDK behaviour | | ❌ out of scope |

## Stretch goals

- Support multi-language orchestration (Python, Go, .NET adapters via Kubb).
- Add config-driven end-to-end smoke testing for generated SDKs.
- Introduce a plugin system for custom generation engines.
- Provide a dashboard or web interface for release visibility.
- Offer metrics integration (GitHub Actions annotations, generation statistics).
- Build an SDK registry index that tracks generated clients and versions.

## Maintainers’ notes

- Keep scope creep in check: the orchestrator should remain generator-agnostic and configuration-first.
- Favour extensibility hooks (pre/post scripts, adapters) over hard-coded workflows.
- Document supported generators and minimum Node versions prominently (Node ≥ 20 today).
- Revisit this scope document whenever major roadmap items or integrations are added.
