---
title: "Templates"
---

# Templates

`GenxAPI` treats templates as pluggable adapters. Each template packages the tooling, build scripts, and runtime conventions required by an underlying generator. The monorepo currently ships two first-party adapters:

- **[Orval API Client Template](templates/orval-api-client-template.md)** (`@genxapi/template-orval`)
  - Produces TypeScript SDKs with React Query/SWR/Axios clients, MSW mocks, and Rollup builds.
  - Uses the unified configuration (`project.config`, `clients[].config`) to drive Orval’s `output` options.
- **[Kubb API Client Template](templates/kubb-api-client-template.md)** (`@genxapi/template-kubb`)
  - Wraps the Kubb plugin ecosystem (`plugin-client`, `plugin-ts`, `plugin-oas`).
  - Accepts transport and plugin overrides through the same unified interface.

Both templates:

- Expose `MultiClientConfigSchema` + `generateClients` so the CLI can validate and invoke them.
- Ship Rollup + Vitest tooling for building and testing generated SDKs.
- Honour `project.templateOptions` (variables, install toggles, local template path) for bespoke customisations.

Add your own template by publishing a package that exports the same surface area (Zod schema + `generateClients`) and pointing `project.template` at it.
