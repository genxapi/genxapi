---
title: "Unified Generator Config"
---

# Unified Generator Config

This document expands on the engine-agnostic configuration model introduced in October 2025. Declare generator intent once and let the CLI translate it into the correct template-specific shape (Orval, Kubb, or future adapters).

> 📦 **Schema reference** – `packages/generate-api-client/schemas/generate-api-client.schema.json` (the same file published to the `$id` URL). Point your editor to it for IntelliSense.

## Top-level structure

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/eduardoac/api-clients/main/schemas/generate-api-client.schema.json",
  "project": {
    "name": "multi-client-demo",
    "directory": "../examples/multi-client-demo",
    "template": "orval",
    "output": "./src",
    "config": { /* GeneratorOptions */ }
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": { /* overrides */ }
    }
  ],
  "hooks": {
    "beforeGenerate": ["npm run lint"],
    "afterGenerate": ["npm test"]
  }
}
```

- **`project.template`** accepts aliases (`"orval"`, `"kubb"`) or fully-qualified packages (`@eduardoac/orval-api-client-template`).
- **`project.output`** defines the base directory for derived workspaces. Defaults to `./src/<client-name>` if omitted.
- **`project.config`** sets generator defaults; `clients[].config` provides per-client overrides.
- **`hooks`** remain unchanged from earlier releases.

## GeneratorOptions

| Field | Type | Applies to | Behaviour |
|-------|------|------------|-----------|
| `httpClient` | `"axios"` \| `"fetch"` | Orval & Kubb | Sets the HTTP transport (Orval `output.httpClient`, Kubb `plugin-client.client`). |
| `client` | `"react-query"`, `"swr"`, `"vue-query"`, `"svelte-query"`, `"axios"`, `"axios-functions"`, `"angular"`, `"zod"`, `"fetch"` | Orval | Selects the runtime client flavour (see [`client` options](../../.context/orval-output-api-options.md#client)). |
| `mode` | `"single"`, `"split"`, `"split-tag"`, `"split-tags"`, `"tags"`, `"tags-split"` | Orval | Maps to Orval’s output mode. |
| `baseUrl` | `string` | Orval & Kubb | Injects a default base URL (`output.baseUrl`, `plugin-client.baseURL`). |
| `mock` | `boolean` or `{ type: "msw" \| "off", delay?: number, useExamples?: boolean }` | Orval | Controls MSW mock generation. `type: "off"` disables mocks. |
| `prettier` | `boolean` | Orval | Toggles Prettier formatting in generated files. |
| `clean` | `boolean` | Orval | Toggles cleanup of Orval output before writing new files. |
| `plugins` / `kubb` | `{ client?: object, ts?: object, oas?: object }` | Kubb | Merged into the corresponding Kubb plugin blocks.

All properties are optional. Merge order is `project.config` → `clients[].config` → CLI overrides.

## CLI flag parity

| Flag | Config field | Notes |
|------|--------------|-------|
| `--template` | `project.template` | Same alias resolution as the config file. |
| `--http-client` | `config.httpClient` | Applies to every client post-parse. |
| `--client` | `config.client` | Only used by Orval. |
| `--mode` | `config.mode` | Orval output mode override. |
| `--base-url` | `config.baseUrl` | Overwrites both Orval and Kubb defaults. |
| `--mock-type` | `config.mock.type` | Use `msw` or `off`. |
| `--mock-delay` | `config.mock.delay` | Integer milliseconds. |
| `--mock-use-examples` | `config.mock.useExamples = true` | Flag (omit to leave unchanged). |

The CLI merges overrides after validation, ensuring they win over file-based values.

## Mapping to templates

### Orval (`@eduardoac/orval-api-client-template`)

| Unified option | Orval output | Notes |
|----------------|--------------|-------|
| `httpClient` | `output.httpClient` | Only emitted when provided. |
| `client` | `output.client` | Values align with Orval’s client catalogue. |
| `mode` | `output.mode` | Supports `split`, `split-tags`, etc. |
| `baseUrl` | `output.baseUrl` | Leave undefined to keep Orval’s default. |
| `mock` | `output.mock` | Boolean or MSW object. `{ type: "off" }` becomes `false`. |
| `prettier` | `output.prettier` | Mirrors Orval toggle. |
| `clean` | `output.clean` | Mirrors Orval toggle. |

> ℹ️ Dive into [.context/orval-output-api-options.md](../../.context/orval-output-api-options.md) for the exhaustive list of supported Orval options.

### Kubb (`@eduardoac/kubb-api-client-template`)

| Unified option | Kubb plugin | Notes |
|----------------|-------------|-------|
| `httpClient` | `plugin-client.client` | Accepts `fetch` or `axios`. |
| `baseUrl` | `plugin-client.baseURL` | Optional base URL. |
| `plugins.client` | `plugin-client` | Merge additional fields (`dataReturnType`, `operations`, etc.). |
| `plugins.ts` | `plugin-ts` | Controls enum style, barrel strategy, syntax. |
| `plugins.oas` | `plugin-oas` | Controls validation, output path, discriminator handling. |

Any extra keys under `plugins.*` are copied verbatim to `kubb.config.ts`.

## Sample configurations

### Orval-flavoured project

```jsonc
{
  "project": {
    "template": "orval",
    "output": "./src",
    "config": {
      "httpClient": "axios",
      "client": "react-query",
      "mock": { "type": "msw", "useExamples": true }
    }
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": { "baseUrl": "https://api.pets.local" }
    },
    {
      "name": "store",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": {
        "client": "axios",
        "mock": { "type": "off" }
      }
    }
  ]
}
```

### Kubb-flavoured project

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

## Migration tips

1. Set `project.template` to `"orval"` or `"kubb"`.
2. Move shared fields from `clients[].orval` / `clients[].kubb` into `project.config`.
3. Replace template-specific blocks with `clients[].config` overrides.
4. (Optional) Introduce `project.output` so path defaults are derived automatically.
5. Delete redundant per-client `output.workspace` / `output.target` entries if the defaults suit your layout.

The CLI still understands the legacy structure, but new capabilities (HTTP client overrides, advanced mock settings, plugin merges) are only available through the unified schema.

## When to favour CLI overrides

- **CI smoke tests** – `npx client-api-generator generate --dry-run --mock-type off` lets you disable mocks without editing shared config.
- **Ad-hoc builds** – experiments with `--client zod` or `--http-client fetch` remain local.
- **Template switching** – `--template kubb` instantly switches engines, keeping the same `clients[].config` contract.

With this unified interface you can add engines, rotate defaults, or run per-environment overrides without rewriting configuration files.
