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

- Expose `MultiClientConfigSchema` + `generateClients` so the CLI can validate and invoke them.
- Ship Rollup + Vitest tooling for building and testing generated SDKs.
- Honour `project.templateOptions` (variables, install toggles, local template path) for bespoke customisations.
- Are responsible for how generator outputs become a stable package interface for consumers.

## Current vs Planned

Current:

- First-party Orval and Kubb templates.
- Unified config mapped into those templates.
- Custom template packages, as long as they export the expected schema and generation surface.

Planned:

- Additional first-party templates and richer ecosystem support in later phases.

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

Add your own template by publishing a package that exports the same surface area (Zod schema + `generateClients`) and pointing `project.template` at it.
