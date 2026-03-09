# Kubb API Client Template (`@genxapi/template-kubb`)

The Kubb template wraps the [Kubb](https://kubb.dev/) plugin ecosystem so you can orchestrate package generation with the same unified config used by the CLI. This guide explains how to install the template, what it generates, and how to override plugins through configuration.

## Capability Manifest

The Kubb template now declares its capability surface explicitly.

Universal:

- Contract inputs and reproducibility metadata.
- Output layout.
- `httpClient` and `baseUrl`.

Template first-class:

- `plugins.client` / `kubb.client`
- `plugins.ts` / `kubb.ts`
- `plugins.oas` / `kubb.oas`

Escape hatch:

- Raw plugin pass-through in `plugins` / `kubb`
- `project.templateOptions.path`
- `project.templateOptions.variables`

The CLI no longer hardcodes Kubb translation rules in shared core code. Instead, the Kubb template owns unified-config transformation, template-only validation, and dependency planning.

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
 ├── src/index.ts                # Stable package entrypoint assembled by the template
 ├── src/<client>/               # Generated client code (fetch/axios) and schemas
 ├── tsconfig.json
 ├── rollup.config.mjs
 └── README.md
```

The template calls `@kubb/cli generate --config kubb.config.ts` behind the scenes, so anything you can express in the Kubb config file is expressible via `project.config` / `clients[].config`.

## Configuration recap

```json
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

Import the generated package boundary, not internal generator output paths.

### Fetch / axios clients

Kubb emits plain async functions by default. With `httpClient: "fetch"` and `dataReturnType: "data"` you can:

```ts
import { pets } from "petstore-sdk";

const result = await pets.getPets({ query: { limit: 20 } });
console.log(result.data);
```

Switch to axios by setting `httpClient: "axios"` (globally or per client) – the return type adapts automatically if you tweak `dataReturnType`.

### Type shape control

Use `plugins.ts` to adjust how models are emitted:

```json
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
export enum PetStatus {
  /* … */
}
```

### OAS plugin overrides

Anything placed under `plugins.oas` is forwarded directly to `plugin-oas`. Example:

```json
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

| Flag                                 | Effect                                                     |
| ------------------------------------ | ---------------------------------------------------------- |
| `--template kubb`                    | Forces the Kubb template even if config defaults to Orval. |
| `--http-client axios`                | Overrides `plugin-client.client` for all clients.          |
| `--base-url https://api.example.com` | Sets `plugin-client.baseURL`.                              |

Combine CLI overrides with configuration to experiment locally without committing changes.

## Build & publish

The scaffolded `package.json` contains:

- `npm run generate` – invokes `kubb generate --config kubb.config.ts`.
- `npm run build` – wipes `dist/` and bundles the already generated source via Rollup.
- `npm run publish` – runs `build` and then publishes without regenerating contracts or source.
- `npm run test` – executes Vitest.

Current behaviour:

- `generate` can trigger registry publish when `project.publish` enables it.
- The generated package exposes a stable root entrypoint after build.
- `genxapi.manifest.json` records the resolved contract source, checksum, template, and output paths for traceability.
- Package dependencies are derived from the selected Kubb capability plan instead of copied as a static template bundle.
- Axios and Zod are only added when the chosen Kubb client/plugin settings require them.

Planned later:

- Diff-driven release decisions and SemVer inference are not part of the current Kubb template surface.

## Dependency Planning Notes

- Default fetch-based Kubb output keeps the generated package free of extra React-specific dependencies.
- Selecting `httpClient: "axios"` adds axios only when the generated client actually uses it.
- Selecting `plugins.client.parser: "zod"` adds Zod only when the chosen client helper surface requires it.

## Resources

- [Kubb configuration docs](https://kubb.dev/getting-started/configure#plugins)
- [Unified generator config](../configuration/unified-generator-config.md)
- [CLI reference](../../README.md#command-reference)

With the unified configuration you can drive fetch vs. axios, enum syntax, and plugin behaviour without touching `kubb.config.ts`. The template handles the translation so the orchestrator can regenerate and publish SDKs consistently.
