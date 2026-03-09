# @genxapi/template-kubb

Kubb-flavoured sibling of the Orval template. This package scaffolds a TypeScript project, wires a multi-client `kubb.config.ts`, and orchestrates `@kubb/cli` so you can automate SDK generation from OpenAPI definitions.

## Highlights

- Generates per-client Kubb projects with opinionated output folders for schemas, types, and HTTP clients.
- Consumes resolved contract inputs from GenX API, including local snapshots for reproducible remote workflows.
- Produces a README tailored to the generated clients with table output.
- Keeps the same configuration shape as the CLI (`project`, `clients`, `hooks`) so it can plug into `@genxapi/cli`.
- Emits generated packages with separate `generate`, `build`, and `publish` scripts plus `genxapi.manifest.json`.

## Usage

```ts
import { generateClients, loadTemplateConfig } from "@genxapi/template-kubb";

const config = await loadTemplateConfig("./genxapi.config.json");
await generateClients(config, { runKubb: true });
```

See `src/types.ts` for the full schema. Each client can tweak Kubb plugin options through the unified `config.plugins` fields that are merged into sensible defaults.

> Heads up: for now this package assumes you will install `@kubb/cli`, `@kubb/core`, `@kubb/plugin-client`, `@kubb/plugin-oas`, and `@kubb/plugin-ts` inside the generated project. The template’s `package.json` already lists them under `devDependencies`.

### Example configuration fragment

```jsonc
{
  "project": {
    "name": "inventory-client",
    "directory": "./clients/inventory",
    "template": "kubb"
  },
  "clients": [
    {
      "name": "items",
      "swagger": "./specs/inventory.yaml",
      "config": {
        "httpClient": "fetch",
        "plugins": {
          "client": {
            "dataReturnType": "data"
          },
          "ts": {
            "enumType": "asConst"
          }
        }
      }
    }
  ]
}
```

Consumers should import the generated package boundary, not internal `src/` or `dist/` files.
