# Architecture Boundaries

GenX API is an orchestration layer for contract-driven client and package generation. Phase 0 is about making the repository honest about that role.

## Boundary Summary

| Boundary | Owned by | Responsibility |
| ------- | ------- | ------- |
| Backend boundary | Backend team / service | Publish and maintain the OpenAPI or Swagger contract. |
| Consumer boundary | Generated package | Expose the stable interface that applications import and depend on. |
| Template boundary | Template package (`@genxapi/template-orval`, `@genxapi/template-kubb`, custom templates) | Translate intent into generator-specific configuration and artefacts. |
| Core boundary | GenX API core (`@genxapi/cli`) | Orchestrate config loading, lifecycle, metadata, hooks, and shared workflow steps. |

## GenX API Core Responsibilities

GenX API core owns the orchestration layer:

- Discover and validate `genxapi` configuration files.
- Resolve the selected template package and pass unified config into it.
- Apply shared command-line overrides such as `--template`, `--http-client`, `--client`, and `--mock-*`.
- Coordinate lifecycle steps such as dry-run validation, template execution, hooks, repository sync, and registry publish.
- Define the public CLI command surface and document what is shipped today.
- Preserve template richness instead of flattening every generator into a lowest-common-denominator API.

GenX API core does not own generator-specific code generation behaviour. It should not re-implement Orval, Kubb, or backend-specific semantics.

## Template Responsibilities

Templates own generator-specific capabilities:

- Map unified intent into generator-native configuration.
- Declare capability manifests so ownership is explicit instead of implicit.
- Validate template-only options and reject capabilities that belong to another template.
- Plan generated package dependencies from selected template capabilities.
- Scaffold project files, build scripts, and package metadata for the generated package.
- Decide how generator outputs are assembled into a stable package interface.
- Keep generator-specific richness available instead of hiding it behind fake generic abstractions.

Templates should not force consumer applications to reach into generated `src/` or `dist/` internals. They should expose a package boundary that consumers can import.

## Backend Responsibilities

Backends own the contract:

- Publish the OpenAPI or Swagger document that generation runs against.
- Keep the contract aligned with actual server behaviour.
- Version, review, and validate contract changes in backend workflows.
- Avoid leaking backend implementation details into consumer code or template internals.

GenX API should treat the contract as the backend boundary. It should not require access to backend source code or service internals to do its job.

## Consumer Responsibilities

Consumers own application integration:

- Depend on the generated package interface, not generator output paths.
- Upgrade package versions on their own schedule.
- Compose the generated client into their own runtime, application state, and deployment model.

Consumers should not be coupled to Orval files, Kubb files, repo layout, or the backend repository.

## Good Coupling

Good coupling keeps each boundary narrow and explicit:

- Backend publishes `openapi.json`; GenX API reads that contract and delegates generation to a template.
- GenX API passes `project.config` and `clients[].config` into a template; the template maps those settings to Orval or Kubb and declares the capability ownership for that mapping.
- A generated package exposes `import { pets } from "petstore-sdk"`; consumer apps import that package boundary.
- Generation-time publish settings live in `project.publish`; GenX API decides when to run the publish step, while npm still owns registry behaviour.
- Template-specific dependency choices are derived from the template plan, not from hardcoded assumptions in the shared core.

## Bad Coupling

Bad coupling crosses boundaries and makes the system brittle:

- Consumer code imports `../../generated/petstore-sdk/dist/index.js` or `./src/pets/client`.
- GenX API core promises first-class support for every Orval or Kubb feature instead of delegating that richness to templates.
- Templates assume backend repository structure instead of relying on the contract path or URL.
- Generated clients reach back into backend source files or deployment code.
- Public docs describe internal repo helper scripts as if they were the product CLI surface.

## Practical Rule

If a concern is about contract ownership, it belongs at the backend boundary.

If a concern is about package consumption, it belongs at the consumer boundary.

If a concern is generator-specific, it belongs at the template boundary.

If a concern is about lifecycle orchestration, metadata, shared workflow, or command routing, it belongs in GenX API core.
