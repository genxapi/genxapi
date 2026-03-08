# Scope

## Core intent

We are building an orchestration layer for contract-driven client and package generation. The current focus is keeping the contract boundary, template boundary, consumer boundary, and orchestration boundary explicit.

This project does **not** replace Orval, Kubb, or any other generator. Instead, it acts as the conductor that executes whichever engine a template supplies, all under shared guardrails.

## Current Scope

### Generation orchestration

- Uses the engines declared in templates (first-party adapters include Orval and Kubb) to produce SDKs from OpenAPI schemas.
- Accepts a unified configuration surface (`project.template`, `project.config`, `clients[].config`) that is mapped onto each template automatically.
- Supports multiple clients within a monorepo or spread across repositories.
- Can scaffold generated packages into monorepo workspace paths through `project.directory` and client output resolution.
- Handles configuration discovery (`genxapi.config.*`) and per-client overrides.

### Lifecycle orchestration

- Runs headless in CI and local automation.
- Can sync generated changes to GitHub repositories when configured.
- Can publish generated packages to npm or GitHub Packages when configured.
- Can create a GitHub release from explicit release metadata.

### Templating & configuration management

- Provides reusable templates for consistent SDK scaffolding (package manifests, TypeScript configs, bundler settings, etc.).
- Supports config schemas validated via Zod and published JSON Schema.
- Centralises configuration so every SDK follows the same rules.

## Explicit non-goals

- ❌ Replace Orval, Kubb, or other code generation engines.
- ❌ Parse OpenAPI schemas or emit client code directly.
- ❌ Provide runtime SDK layers or HTTP clients.
- ❌ Deliver a web dashboard or graphical interface.
- ❌ Deploy or host generated SDKs beyond packaging and publishing.
- ❌ Hard-code generator-specific logic that prevents future extensibility.

## Boundaries

| Layer | Owned by this project | Delegated / external |
|-------|-----------------------|----------------------|
| CLI & orchestration | ✅ | |
| Schema parsing / SDK codegen | | 🧩 Template-provided engines (e.g. Orval, Kubb, OpenAPI Generator) |
| Templates & project scaffolding | ✅ | 🧩 Generator-specific artefacts |
| Contract ownership | | 🧩 Backend / service owners |
| Package consumption | | 🧩 Consumer applications |
| Publishing (GitHub / npm) | ✅ orchestration | 🧩 GitHub APIs, npm CLI, registries |
| Pipeline execution (CI) | ✅ command layer | 🧩 CI runners |
| Runtime SDK behaviour | | ❌ out of scope |

See [Architecture boundaries](./architecture/boundaries.md) for the concrete definitions.

## Explicitly Planned for Later Phases

- First-class contract diffing.
- Diff-driven SemVer and release intelligence.
- Additional first-party template coverage and multi-language workflows.
- Broader reporting, catalog, or dashboard surfaces.

## Maintainers’ notes

- Keep scope creep in check: the orchestrator should remain generator-agnostic and configuration-first.
- Favour extensibility hooks (pre/post scripts, adapters) over hard-coded workflows.
- Document supported generators and minimum Node versions prominently (Node ≥ 20 today).
- Revisit this scope document whenever major roadmap items or integrations are added.
