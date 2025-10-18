# Toolkit Context — API Client Generator

This reference keeps the assistant aligned with the actual tooling, stack, and automation already built into the monorepo.

---

## 1. Workspace & Build Tooling

- **npm workspaces** orchestrate `@eduardoac/api-client-template` and `@eduardoac/generate-api-client`.
- **Rollup** builds each package (ESM output + bundled type definitions via `rollup-plugin-dts`).
- **TypeScript** targets ES2022; package configs extend `tsconfig.base.json`.
- **Vitest v3** supplies the test runner (configured globally in `vitest.config.ts`).
- **ESLint + Prettier** enforce style and lint rules (see `.eslintrc.cjs`, `.prettierrc.json`).
- **Node 20+** recommended when running the generator: Orval 7 uses Commander 14 and prints engine warnings on older runtimes.

---

## 2. Template Package (`@eduardoac/api-client-template`)

- Exposes `generateClients`, `loadTemplateConfig`, and schema exports for multi-client configs.
- Uses **Cosmiconfig** to discover JSON/YAML config files.
- Handles project scaffolding with **fs-extra**, token replacement, swagger copying, and optional hook execution via **execa**.
- Generates Orval configuration dynamically; Orval itself is an **optional peer dependency** (not bundled) so consumers decide how to install/run it.
- Template assets (`src/template`) include Rollup config, TypeScript configs, and placeholder runtime code ready for Orval output.

---

## 3. CLI Package (`@eduardoac/generate-api-client`)

- Built with **Commander**; commands:
  - `generate` — validates config, invokes `generateClients`, supports dry runs/log-level overrides, optional GitHub sync, and optional npm publish.
  - `publish` — uses **Octokit** to create GitHub releases.
- Config loading reuses **Cosmiconfig** and mirrors the Zod schemas exported by the template package.
- Spinner feedback via **Ora**, colored logs with **Chalk**.
- Ships a JSON schema (`schemas/generate-api-client.schema.json`) for editor integration.
- GitHub automation lives in `src/services/github.ts`; npm publish orchestration in `src/services/npm.ts`.

---

## 4. Sample Config & Lifecycle

- `samples/multi-client.config.json` demonstrates:
  - Project metadata (target directory, package manager).
  - Multiple client definitions with swagger sources, workspace/target paths, Orval options.
- Typical flow: `generate` command -> optional hooks -> GitHub sync / PR (if configured) -> npm publish (if configured) -> `publish` command for GitHub release.
- Orval execution is delegated; template runs `pnpm/yarn/npm/bun dlx orval` when configured.

---

## 5. Guardrails for New Code

- Prefer TypeScript, async/await, and the existing dependency stack.
- Keep new configs discoverable via Cosmiconfig or explicit CLI flags.
- When adding automation (e.g., npm publish, repo creation), reuse Octokit/execa patterns already present.
- Maintain deterministic behavior: avoid network side effects unless behind explicit commands/flags.

---

_Last updated: 2025-10-18_
