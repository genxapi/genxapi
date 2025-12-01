---
title: "Configuration Overview"
---

# Configuration Overview

`GenxAPI` reads a single configuration file (`genxapi.config.json`, `.yaml`, or `.ts`) that now uses a **unified interface** regardless of whether you run Orval, Kubb, or future adapters. This page provides a narrative overview and links to the full schema reference.

- **Unified schema**: One set of fields expresses generator intent (`httpClient`, `client`, `mode`, `mock`, plugin overrides). The CLI maps these options onto the selected template.
- **Template selection**: `project.template` accepts the aliases `"orval"` and `"kubb"` (or a full package name such as `@genxapi/template-orval`).
- **Per-client overrides**: `clients[].config` can override any project-level option.
- **CLI flags**: `--template`, `--http-client`, `--client`, `--mode`, `--mock-*`, and `--base-url` mirror their config counterparts for one-off runs or CI jobs.

For the full JSON Schema, mapping tables, and advanced examples read the dedicated guide:

> 📘 **[Unified generator config](configuration/unified-generator-config.md)**

Below is a trimmed example highlighting the most common fields:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/genxapi/genxapi/main/schemas/genxapi.schema.json",
  "logLevel": "info",
  "project": {
    "name": "multi-client-demo",
    "directory": "../examples/multi-client-demo",
    "template": "orval",
    "output": "./src",
    "config": {
      "httpClient": "axios",
      "client": "react-query",
      "mode": "split",
      "mock": { "type": "msw", "delay": 250 }
    },
    "repository": { /* GitHub automation */ },
    "publish": { /* npm automation */ }
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
        "httpClient": "axios",
        "mock": { "type": "off" }
      }
    }
  ],
  "hooks": {
    "beforeGenerate": ["npm run lint"],
    "afterGenerate": ["npm test"]
  }
}
```

### Response to CLI overrides

Any CLI flags you pass are merged after config parsing, so the following command:

```bash
npx genxapi generate \
  --template kubb \
  --http-client fetch \
  --mock-type msw \
  --mock-delay 1000
```

forces the `kubb` template, switches the HTTP client to `fetch`, and enables MSW mocks with a 1s delay—even if the config file requested different defaults.

### Migrating from legacy configs

Earlier versions required template-specific sections (`clients[].orval` / `clients[].kubb`). Those blocks still work, but the generator now prefers the unified shape. To migrate:

1. Move common options into `project.config`.
2. Replace `clients[].orval` or `clients[].kubb` with `clients[].config`.
3. Set `project.template` to `"orval"` or `"kubb"` (or the fully-qualified package name).
4. Delete redundant `output.workspace/target` fields if you want the orchestrator to derive them from `project.output`.

The CLI will continue to resolve the legacy format, but new features (HTTP client overrides, advanced mock settings, plugin merges) are only available via the unified schema.
