# @eduardoac/orval-api-client-template

Reusable Orval template that supports generating multiple clients from a single configuration file. It:

- Loads JSON/YAML config files via `loadTemplateConfig`/`searchTemplateConfig`.
- Scaffolds the bundled template, applies token replacements, copies swagger specs.
- Generates Orval config and optionally executes Orval + hook scripts.
- Supports optional GitHub sync/pull request and npm publish settings (consumed by the CLI).

## Usage

```ts
import { loadTemplateConfig, generateClients } from "@eduardoac/orval-api-client-template";

const config = await loadTemplateConfig("./multi-client.config.json");
await generateClients(config);
```

### Example

```jsonc
// examples/petstore/api-client-generator.config.json
{
  "project": {
    "name": "petstore-client",
    "directory": "./examples/petstore/output",
    "template": {
      "name": "@eduardoac/orval-api-client-template"
    },
    "repository": {
      "owner": "your-github-handle",
      "name": "petstore-client",
      "pullRequest": {
        "title": "chore: refresh petstore client"
      }
    },
    "publish": {
      "npm": {
        "enabled": true,
        "command": "npm",
        "tag": "latest"
      }
    },
    "readme": {
      "introduction": "Demo SDK generated from the public Petstore API.",
      "additionalSections": [
        {
          "title": "Support",
          "body": "Contact the platform team if you need additional endpoints exposed in this client."
        }
      ]
    }
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "output": {
        "workspace": "./src/pets",
        "target": "./src/pets/client.ts"
      }
    }
  ]
}
```

## Configuration Highlights

```jsonc
{
  "project": {
    "name": "demo-client",
    "directory": "./clients/demo",
    "template": { "name": "@eduardoac/orval-api-client-template" },
    "repository": {
      "owner": "your-handle",
      "name": "demo-client-repo",
      "pullRequest": { "branchPrefix": "chore/clients" }
    }
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "./specs/petstore.yaml",
      "output": {
        "workspace": "./src/pets",
        "target": "./src/pets/client.ts"
      },
      "orval": {
        "client": "react-query",
        "httpClient": "axios",
        "mock": { "type": "msw", "delay": 300 }
      }
    }
  ]
}
```

See `samples/multi-client.config.json` for a full example.
