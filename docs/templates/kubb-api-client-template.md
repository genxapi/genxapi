# Kubb API Client Template (`@genxapi/template-kubb`)

The Kubb template wraps the [Kubb](https://kubb.dev/) plugin ecosystem so you can orchestrate TypeScript (and multi-language) SDKs with the same unified config used by the CLI. This guide explains how to install the template, what it generates, and how to override plugins through configuration.

## Installation

```bash
npm install --save-dev @genxapi/cli @genxapi/template-kubb
```

Install the Kubb CLI/runtime you plan to use (versions ≥ 4.1.3):

```bash
npm install --save-dev @kubb/cli @kubb/core @kubb/plugin-client @kubb/plugin-ts @kubb/plugin-oas
```

## Generated project layout

```
examples/<project>/
 ├── package.json                # Includes Kubb plugins, Rollup, Vitest
 ├── kubb.config.ts              # Derived from unified config + per-client overrides
 ├── src/<client>/               # Generated client code (fetch/axios) and schemas
 ├── tsconfig.json
 ├── rollup.config.mjs
 └── README.md
```

The template calls `@kubb/cli generate --config kubb.config.ts` behind the scenes, so anything you can express in the Kubb config file is expressible via `project.config` / `clients[].config`.

## Configuration recap

```jsonc
{
  "project": {
    "template": "kubb",
    "output": "./src",
    "config": {
      "httpClient": "fetch",
      "plugins": {
        "client": { "dataReturnType": "data" },
        "ts": { "enumType": "asConst" }
      }
    }
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json"
    },
    {
      "name": "store",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": {
        "httpClient": "axios",
        "plugins": {
          "client": { "dataReturnType": "full" },
          "ts": { "enumType": "enum" }
        }
      }
    }
  ]
}
```

- `httpClient` maps directly to `plugin-client.client` (fetch ↔ axios).
- `plugins.client`, `plugins.ts`, and `plugins.oas` merge into the respective Kubb plugin configurations per client.
- Additional keys are passed through unchanged, so you can set `operations`, `output.clean`, `validate`, etc.

## Consuming the generated SDK

### Fetch / axios clients

Kubb emits plain async functions by default. With `httpClient: "fetch"` and `dataReturnType: "data"` you can:

```ts
import { getPets } from "./src/pets/client";

const pets = await getPets({ query: { limit: 20 } });
console.log(pets.data);
```

Switch to axios by setting `httpClient: "axios"` (globally or per client) – the return type adapts automatically if you tweak `dataReturnType`.

### Type shape control

Use `plugins.ts` to adjust how models are emitted:

```jsonc
{
  "project": {
    "config": {
      "plugins": {
        "ts": {
          "enumType": "constEnum",
          "barrelType": "named"
        }
      }
    }
  }
}
```

This translates to:

```ts
export enum PetStatus { /* … */ }
```

### OAS plugin overrides

Anything placed under `plugins.oas` is forwarded directly to `plugin-oas`. Example:

```jsonc
{
  "clients": [
    {
      "name": "pets",
      "swagger": "./specs/pets.yaml",
      "config": {
        "plugins": {
          "oas": {
            "validate": true,
            "serverIndex": 1
          }
        }
      }
    }
  ]
}
```

## CLI overrides

| Flag | Effect |
|------|--------|
| `--template kubb` | Forces the Kubb template even if config defaults to Orval. |
| `--http-client axios` | Overrides `plugin-client.client` for all clients. |
| `--base-url https://api.example.com` | Sets `plugin-client.baseURL`. |

Combine CLI overrides with configuration to experiment locally without committing changes.

## Build & publish

The scaffolded `package.json` contains:

- `npm run generate-clients` – invokes `kubb generate --config kubb.config.ts`.
- `npm run build` – wipes `dist/`, regenerates clients, then bundles via Rollup.
- `npm run test` – executes Vitest.

Respect `publish.npm` settings in your top-level config to publish via `genxapi publish`.

## Resources

- [Kubb configuration docs](https://kubb.dev/getting-started/configure#plugins)
- [Unified generator config](../configuration/unified-generator-config.md)
- [CLI reference](../../README.md#command-reference)

With the unified configuration you can drive fetch vs. axios, enum syntax, and plugin behaviour without touching `kubb.config.ts`. The template handles the translation so the orchestrator can regenerate and publish SDKs consistently.
