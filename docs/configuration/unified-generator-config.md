---
title: "Unified Generator Config"
---

# Unified Generator Config

Declare generator intent once and let the CLI translate it into the correct template-specific shape for the selected template.

> 📦 **Schema reference** – local file: `packages/cli/schemas/genxapi.schema.json`
>
> Raw URL: `https://raw.githubusercontent.com/genxapi/genxapi/main/packages/cli/schemas/genxapi.schema.json`

## Top-level structure

```json
{
  "$schema": "https://raw.githubusercontent.com/genxapi/genxapi/main/packages/cli/schemas/genxapi.schema.json",
  "project": {
    "name": "multi-client-demo",
    "directory": "../examples/multi-client-demo",
    "template": "orval",
    "output": "./src",
    "config": {
      "httpClient": "axios",
      "client": "react-query"
    }
  },
  "clients": [
    {
      "name": "pets",
      "contract": {
        "source": "https://petstore3.swagger.io/api/v3/openapi.json",
        "snapshot": true
      },
      "config": {
        "baseUrl": "https://api.pets.local"
      }
    }
  ],
  "hooks": {
    "beforeGenerate": ["npm run lint"],
    "afterGenerate": ["npm test"]
  }
}
```

- **`project.template`** accepts built-in aliases (`"orval"`, `"kubb"`), fully-qualified package names, or an explicit external template reference object.
- **`project.output`** defines the base directory for derived workspaces. Defaults to `./src/<client-name>` if omitted.
- **`project.config`** sets generator defaults; `clients[].config` provides per-client overrides.
- **`clients[].swagger`** remains the shorthand contract field; **`clients[].contract`** is the first-class form for auth, snapshots, and checksums.
- **`hooks`** remain unchanged from earlier releases.
- **Config format today** can be JSON, YAML, or TypeScript.

## Contract sources

Every client can declare its contract in one of two ways:

- `swagger: "https://..."` or `swagger: "./specs/pets.yaml"` for the compact form.
- `contract: { ... }` for reproducible workflows, authenticated remote fetches, and manifest metadata.

| Field               | Type                                                                                                                                   | Behaviour                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contract.source`   | `string`                                                                                                                               | Local path or remote URL for the OpenAPI/Swagger document.                                                                                              |
| `contract.auth`     | `{ type: "bearer", tokenEnv }` or `{ type: "basic", usernameEnv, passwordEnv }` or `{ type: "header", headerName, valueEnv, prefix? }` | Uses environment variables at generation time so secrets stay out of config files and logs.                                                             |
| `contract.snapshot` | `boolean` or `{ path?: string }`                                                                                                       | Writes a local snapshot that the generator consumes. This is the recommended mode for remote inputs and is required for authenticated remote contracts. |
| `contract.checksum` | `boolean` or `{ algorithm?: "sha256" \| "sha512" }`                                                                                    | Calculates a checksum and records it in `genxapi.manifest.json`.                                                                                        |

Notes:

- Remote contracts are safer and more reproducible when `snapshot` is enabled because the generator reads a fixed file instead of refetching a mutable URL.
- Authenticated remote contracts are always resolved before template execution so Orval/Kubb never need direct secret access in their config files.
- `genxapi.manifest.json` captures the resolved contract source, snapshot path, checksum, output paths, template, and generation timestamp for traceability.

### Secure remote contract example

```json
{
  "clients": [
    {
      "name": "pets",
      "contract": {
        "source": "https://api.example.com/openapi.json",
        "auth": {
          "type": "bearer",
          "tokenEnv": "OPENAPI_TOKEN"
        },
        "snapshot": {
          "path": ".genxapi/contracts/pets.json"
        },
        "checksum": {
          "algorithm": "sha256"
        }
      }
    }
  ]
}
```

`OPENAPI_TOKEN` should be injected by your shell, CI system, or secret manager. Do not hardcode tokens in `source` URLs or config files.

## GeneratorOptions

GenX API now treats these settings as three distinct ownership classes:

- Universal options are shared intent that the core understands and templates map into their own native config.
- Template first-class options are documented, supported parts of a specific template surface.
- Escape hatch options stay template-owned and are passed through or handled by the template without being promoted as universal API.

| Field              | Type                                                                                                                       | Applies to   | Behaviour                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| `httpClient`       | `"axios"` \| `"fetch"`                                                                                                     | Orval & Kubb | Sets the HTTP transport (Orval `output.httpClient`, Kubb `plugin-client.client`).                               |
| `client`           | `"react-query"`, `"swr"`, `"vue-query"`, `"svelte-query"`, `"axios"`, `"axios-functions"`, `"angular"`, `"zod"`, `"fetch"` | Orval        | Selects the runtime client flavour. |
| `mode`             | `"single"`, `"split"`, `"split-tag"`, `"split-tags"`, `"tags"`, `"tags-split"`                                             | Orval        | Maps to Orval’s output mode.                                                                                    |
| `baseUrl`          | `string`                                                                                                                   | Orval & Kubb | Injects a default base URL (`output.baseUrl`, `plugin-client.baseURL`).                                         |
| `mock`             | `boolean` or `{ type: "msw" \| "off", delay?: number, useExamples?: boolean }`                                             | Orval        | Controls MSW mock generation. `type: "off"` disables mocks.                                                     |
| `prettier`         | `boolean`                                                                                                                  | Orval        | Toggles Prettier formatting in generated files.                                                                 |
| `clean`            | `boolean`                                                                                                                  | Orval        | Toggles cleanup of Orval output before writing new files.                                                       |
| `plugins` / `kubb` | `{ client?: object, ts?: object, oas?: object }`                                                                           | Kubb         | Merged into the corresponding Kubb plugin blocks.                                                               |

All properties are optional. Merge order is `project.config` → `clients[].config` → CLI overrides.

## Capability Ownership By Template

### Universal

- Contract source selection, auth, snapshot, and checksum.
- Output layout (`project.output`, `clients[].output`).
- `httpClient` and `baseUrl`.

### Orval first-class

- `client`
- `mode`
- `mock`
- `prettier`
- `clean`

### Kubb first-class

- `plugins.client`
- `plugins.ts`
- `plugins.oas`
- `kubb.client`
- `kubb.ts`
- `kubb.oas`

### Escape hatches

- `project.templateOptions.path`
- `project.templateOptions.variables`
- Raw Kubb plugin pass-through inside `plugins` / `kubb`

Template-specific validation now lives inside the template boundary. For example, the Orval template rejects Kubb-only plugin blocks, and the Kubb template rejects Orval-only `mode` / `mock` style settings.

## Template Selection

### Built-in template

```json
{
  "project": {
    "template": "orval"
  }
}
```

### Explicit external template

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

`module` can be a package name or a relative/absolute filesystem path. Relative paths resolve from the config file directory.

Use the explicit external form when you want a real external template contract with capability manifests, validation hooks, config transformation, generation hooks, dependency planning, and plan/report participation.

Use `project.templateOptions.path` only to swap scaffold files inside an already selected template.

## CLI flag parity

| Flag                  | Config field                     | Notes                                     |
| --------------------- | -------------------------------- | ----------------------------------------- |
| `--template`          | `project.template`               | Same alias resolution as the config file. |
| `--http-client`       | `config.httpClient`              | Applies to every client post-parse.       |
| `--client`            | `config.client`                  | Only used by Orval.                       |
| `--mode`              | `config.mode`                    | Orval output mode override.               |
| `--base-url`          | `config.baseUrl`                 | Overwrites both Orval and Kubb defaults.  |
| `--mock-type`         | `config.mock.type`               | Use `msw` or `off`.                       |
| `--mock-delay`        | `config.mock.delay`              | Integer milliseconds.                     |
| `--mock-use-examples` | `config.mock.useExamples = true` | Flag (omit to leave unchanged).           |

The CLI merges overrides after validation, ensuring they win over file-based values.

Note: `--template` accepts alias and package strings. Use the config file when you need an explicit external template object with `provider`, `module`, or a non-default export name.

## Mapping to templates

### Orval (`@genxapi/template-orval`)

| Unified option | Orval output        | Notes                                                     |
| -------------- | ------------------- | --------------------------------------------------------- |
| `httpClient`   | `output.httpClient` | Only emitted when provided.                               |
| `client`       | `output.client`     | Values align with Orval’s client catalogue.               |
| `mode`         | `output.mode`       | Supports `split`, `split-tags`, etc.                      |
| `baseUrl`      | `output.baseUrl`    | Leave undefined to keep Orval’s default.                  |
| `mock`         | `output.mock`       | Boolean or MSW object. `{ type: "off" }` becomes `false`. |
| `prettier`     | `output.prettier`   | Mirrors Orval toggle.                                     |
| `clean`        | `output.clean`      | Mirrors Orval toggle.                                     |

> ℹ️ Dive into the [Orval documentation](https://orval.dev) for the exhaustive list of supported Orval options.

### Kubb (`@genxapi/template-kubb`)

| Unified option   | Kubb plugin             | Notes                                                           |
| ---------------- | ----------------------- | --------------------------------------------------------------- |
| `httpClient`     | `plugin-client.client`  | Accepts `fetch` or `axios`.                                     |
| `baseUrl`        | `plugin-client.baseURL` | Optional base URL.                                              |
| `plugins.client` | `plugin-client`         | Merge additional fields (`dataReturnType`, `operations`, etc.). |
| `plugins.ts`     | `plugin-ts`             | Controls enum style, barrel strategy, syntax.                   |
| `plugins.oas`    | `plugin-oas`            | Controls validation, output path, discriminator handling.       |

Any extra keys under `plugins.*` are copied verbatim to `kubb.config.ts`.

## Sample configurations

### Orval-flavoured project

```json
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

## Migration tips

1. Set `project.template` to `"orval"` or `"kubb"` (or an explicit external template reference if you own a custom template contract).
2. Move shared fields from `clients[].orval` / `clients[].kubb` into `project.config`.
3. Replace template-specific blocks with `clients[].config` overrides.
4. (Optional) Introduce `project.output` so path defaults are derived automatically.
5. Delete redundant per-client `output.workspace` / `output.target` entries if the defaults suit your layout.

The CLI still understands the legacy structure, but new capabilities (HTTP client overrides, advanced mock settings, plugin merges) are only available through the unified schema.

## When to Favour CLI Overrides

- **CI smoke tests** – `npx genxapi generate --dry-run --mock-type off` lets you disable mocks without editing shared config.
- **Ad-hoc builds** – experiments with `--client zod` or `--http-client fetch` remain local.
- **Template switching** – `--template kubb` instantly switches engines, keeping the same `clients[].config` contract.

With this unified interface you can add engines, rotate defaults, or run per-environment overrides without rewriting configuration files.

For the manifest structure emitted by generation, see [Generation manifest](../generation-manifest.md). For external template authoring guidance, see [External template authoring](../templates/external-template-authoring.md).
