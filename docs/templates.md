---
title: "Templates"
---

# Templates

GenX API treats templates as pluggable adapters. Templates own generator-specific behaviour; GenX API core owns orchestration. The monorepo currently ships two first-party template packages:

- **[Orval API Client Template](templates/orval-api-client-template.md)** (`@genxapi/template-orval`)
  - Produces TypeScript SDK packages with Orval-specific client, mock, and bundling behaviour.
  - Uses the unified configuration (`project.config`, `clients[].config`) to drive Orval’s output options.
- **[Kubb API Client Template](templates/kubb-api-client-template.md)** (`@genxapi/template-kubb`)
  - Wraps the Kubb plugin ecosystem (`plugin-client`, `plugin-ts`, `plugin-oas`).
  - Accepts transport and plugin overrides through the same unified interface.

Both templates:

- Expose a stable `genxTemplate` contract so the CLI can validate, transform, plan, and invoke them explicitly.
- Ship Rollup + Vitest tooling for building and testing generated SDKs.
- Honour `project.templateOptions` (variables, install toggles, local template path) for bespoke customisations.
- Are responsible for how generator outputs become a stable package interface for consumers.

## Stable Template Contract

Built-in templates now register themselves through a stable template contract:

- `id` and `displayName` make template identity explicit inside the CLI registry.
- `capabilityManifest` declares which features are universal, template first-class, or escape hatches.
- `transformUnifiedConfig` owns template-specific translation from the unified GenX API config into native Orval/Kubb config.
- `validateConfig` keeps template-specific validation inside the template boundary.
- `planGeneration` derives selected capabilities, package dependencies, and documentation hints before generation.
- `generateClients` remains the template-owned generation lifecycle entrypoint.

The CLI registry resolves built-in templates explicitly instead of branching on template names across the core. Unknown packages can still load through the legacy `MultiClientConfigSchema + generateClients` surface, but unified-config translation now belongs to templates that export `genxTemplate`.

## Capability Ownership

Template manifests classify capabilities into three groups:

- `universal` means GenX API core owns the user intent and lifecycle, while templates map that intent into generator-native config. Examples: contract inputs, output layout, `httpClient`, `baseUrl`.
- `template-first-class` means the feature is generator-specific but intentionally promoted as a documented part of that template surface. Examples: Orval `client` / `mode` / `mock`, Kubb plugin-client / plugin-ts / plugin-oas behaviour.
- `escape-hatch` means the template owns the capability entirely and GenX API keeps it explicit without pretending it is universal. Examples: local scaffold overrides, template variables, raw Kubb plugin pass-through.

This keeps the core generic while preserving generator richness where it belongs.

## Current vs Planned

Current:

- First-party Orval and Kubb templates.
- Unified config mapped into those templates through template-owned translation.
- Built-in template registry with explicit capability manifests and dependency planning.
- Custom template packages, as long as they export the expected schema and generation surface.

Planned:

- Additional first-party templates and richer ecosystem support in later phases.
- A published external-template SDK can be extracted later if the runtime contract proves stable enough to freeze formally.

## Consumer Boundary Reminder

Consumers should import the generated package boundary, not generator internals. Good examples:

```ts
import { pets } from "petstore-sdk";
```

Bad examples:

```ts
import { getPets } from "./src/pets/client";
import "../../generated/petstore-sdk/dist/index.js";
```

Add your own template by publishing a package that exports `genxTemplate` (preferred) or the legacy schema/generator surface and pointing `project.template` at it.
