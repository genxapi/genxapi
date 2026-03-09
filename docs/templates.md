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

## Selecting a Template

### Built-in templates

Use the short aliases or package names for first-party templates:

```json
{
  "project": {
    "template": "orval"
  }
}
```

`"kubb"` and fully-qualified package names such as `@genxapi/template-orval` remain valid.

### External templates

Use an explicit external template reference when a team owns a separate template package or a local template module:

```json
{
  "project": {
    "template": {
      "provider": "external",
      "module": "@acme/genxapi-template",
      "export": "genxTemplate"
    }
  }
}
```

For local development, `module` can point at a relative or absolute filesystem path. Relative paths resolve from the directory that contains the GenX API config file.

This path is intentional:

- GenX API knows whether it is loading a built-in or external template.
- Explicit external references require a stable contract export; they do not fall back to the legacy `MultiClientConfigSchema + generateClients` surface.
- Capability discovery, validation, and planning still run through the same contract as built-in templates.

Legacy package strings still work for backwards compatibility, but the explicit `provider: "external"` form is the recommended path for new integrations.

## Stable Template Contract

Built-in and external templates now register themselves through a stable template contract:

- `id` and `displayName` make template identity explicit inside the CLI registry.
- `capabilityManifest` declares which features are universal, template first-class, or escape hatches.
- `transformUnifiedConfig` owns template-specific translation from the unified GenX API config into native Orval/Kubb config.
- `validateConfig` keeps template-specific validation inside the template boundary.
- `planGeneration` derives selected capabilities, package dependencies, and documentation hints before generation.
- `generateClients` remains the template-owned generation lifecycle entrypoint.

The CLI registry resolves built-in templates explicitly instead of branching on template names across the core. Explicit external references load through the same contract and are validated before the CLI accepts them. Legacy package strings can still load through `MultiClientConfigSchema + generateClients`, but unified-config translation belongs to templates that export `genxTemplate`.

## External Template Contract

An external template should provide:

- Template identity:
  `id`, `name`, `displayName`, and any `aliases` it wants to claim.
- Capability manifest:
  `capabilityManifest.summary` plus capability entries that classify ownership as `universal`, `template-first-class`, or `escape-hatch`.
- Validation hooks:
  `schema` for structural parsing and `validateConfig` for template-specific guardrails.
- Config transformation:
  `transformUnifiedConfig` when the template accepts the shared GenX API unified config.
- Generation hook:
  `generateClients` as the template-owned execution entrypoint.
- Dependency planning:
  `planGeneration` should declare selected capabilities plus the dependency plan for the generated package.
- Output metadata or documentation hints:
  `planGeneration.output` and `planGeneration.documentationHints` when the template wants CLI plans and generated READMEs to explain package boundaries or follow-up steps.

The CLI now validates capability manifests and ensures `planGeneration.selectedCapabilities` only references capabilities declared in the manifest. That keeps external templates inside the same discovery and reporting model as first-party templates.

## Capability Ownership

Template manifests classify capabilities into three groups:

- `universal` means GenX API core owns the user intent and lifecycle, while templates map that intent into generator-native config. Examples: contract inputs, output layout, `httpClient`, `baseUrl`.
- `template-first-class` means the feature is generator-specific but intentionally promoted as a documented part of that template surface. Examples: Orval `client` / `mode` / `mock`, Kubb plugin-client / plugin-ts / plugin-oas behaviour.
- `escape-hatch` means the template owns the capability entirely and GenX API keeps it explicit without pretending it is universal. Examples: local scaffold overrides, template variables, raw Kubb plugin pass-through.

This keeps the core generic while preserving generator richness where it belongs.

## Choose the Right Path

### Built-in template

Use a built-in template when Orval or Kubb already cover the generator you need and you want the narrowest maintenance surface.

### External template

Use an external template when your team owns a different generator or needs package-assembly behaviour that does not belong inside GenX API core.

### Escape hatch

Use escape hatches when you still want a built-in template but need local scaffold tweaks or generator-native pass-through:

- `project.templateOptions.path` swaps the scaffold files used by the selected template.
- `project.templateOptions.variables` injects template-local placeholder values.
- Template-native pass-through such as Kubb plugin overrides stay inside that template boundary.

Escape hatches do not create a new template contract. They customise an existing template.

## Current vs Planned

Current:

- First-party Orval and Kubb templates.
- Unified config mapped into those templates through template-owned translation.
- Built-in template registry with explicit capability manifests and dependency planning.
- Explicit external template loading through a stable contract.
- Legacy package-string loading for older custom templates.

Planned:

- Additional first-party templates and richer ecosystem support in later phases.
- A separate authoring SDK can still be extracted later if the contract proves stable enough to freeze independently from `@genxapi/cli`.

## Authoring and Adoption Guides

- [External template authoring](templates/external-template-authoring.md)
- [Custom template guidance](templates/custom-template-guidance.md)

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
