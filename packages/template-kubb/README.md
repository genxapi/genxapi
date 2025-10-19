# @genxapi/template-kubb

Kubb-flavoured sibling of the Orval template. This package scaffolds a TypeScript project, wires a multi-client `kubb.config.ts`, and orchestrates `@kubb/cli` so you can automate SDK generation from OpenAPI definitions.

## Highlights

- Generates per-client Kubb projects with opinionated output folders for schemas, types, and HTTP clients.
- Copies OpenAPI specifications into the generated workspace (or references remote URLs) just like the Orval variant.
- Produces a README tailored to the generated clients with table output.
- Keeps the same configuration shape as the CLI (`project`, `clients`, `hooks`) so it can plug into `@genxapi/cli`.

## Usage

```ts
import { generateClients, loadTemplateConfig } from "@genxapi/template-kubb";

const config = await loadTemplateConfig("./genxapi.config.json");
await generateClients(config, { runKubb: true });
```

See `src/types.ts` for the full schema. Each client can tweak the Kubb plugin options via the `kubb.oas`, `kubb.ts`, and `kubb.client` objects which are shallowly merged into sensible defaults.

> Heads up: for now this package assumes you will install `@kubb/cli`, `@kubb/core`, `@kubb/plugin-client`, `@kubb/plugin-oas`, and `@kubb/plugin-ts` inside the generated project. The template’s `package.json` already lists them under `devDependencies`.

### Example configuration fragment

```jsonc
{
  "project": {
    "name": "inventory-client",
    "directory": "./clients/inventory",
    "template": { "name": "@genxapi/template-kubb" }
  },
  "clients": [
    {
      "name": "items",
      "swagger": "./specs/inventory.yaml",
      "kubb": {
        "client": {
          "client": "fetch",
          "dataReturnType": "data"
        },
        "ts": {
          "enumType": "asConst"
        }
      }
    }
  ]
}
```
