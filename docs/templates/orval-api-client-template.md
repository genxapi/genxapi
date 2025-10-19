# Orval API Client Template (`@genxapi/template-orval`)

The Orval template scaffolds a TypeScript SDK and orchestrates Orval’s generator with opinionated defaults for React Query, MSW mocks, and Rollup bundling. This guide covers installation, generated layout, and how to consume the artefacts.

## Installation

```bash
npm install --save-dev @genxapi/cli @genxapi/template-orval
```

Orval itself remains a peer dependency – install whichever version you need:

```bash
npm install --save-dev orval
```

## Generated project layout

Running `npx genxapi generate` with `project.template: "orval"` produces:

```
examples/<project>/
 ├── package.json                # Includes build/test scripts, orval + rollup deps
 ├── orval.config.ts             # Generated from unified config options
 ├── src/
 │    ├── <client>/client.ts     # Fully-typed HTTP clients / hooks
 │    └── <client>/model/…       # Schemas & types
 ├── mocks/
 │    └── handlers.ts            # MSW handlers (when mocks enabled)
 ├── tsconfig.json               # Project local TS settings
 ├── rollup.config.mjs           # Builds `dist/`
 └── README.md                   # Derived from config.project.readme
```

## Configuration recap

All generator intent now lives under `project.config` and `clients[].config`:

```jsonc
{
  "project": {
    "template": "orval",
    "output": "./src",
    "config": {
      "httpClient": "axios",
      "client": "react-query",
      "mode": "split",
      "mock": { "type": "msw", "delay": 250 }
    }
  },
  "clients": [
    {
      "name": "pets",
      "swagger": "https://petstore3.swagger.io/api/v3/openapi.json",
      "config": { "baseUrl": "https://api.pets.local" }
    }
  ]
}
```

The CLI converts these options to Orval’s `output` block. For the exhaustive list of valid values see [.context/orval-output-api-options.md](../../.context/orval-output-api-options.md).

## Consuming the generated SDK

### React Query hooks

With `client: "react-query"` you receive ready-made hooks:

```ts
import { useGetPetsQuery } from "./src/pets/client";

export function PetsList() {
  const { data, isLoading } = useGetPetsQuery();
  if (isLoading) return <p>Loading…</p>;
  return (
    <ul>
      {data?.map((pet) => (
        <li key={pet.id}>{pet.name}</li>
      ))}
    </ul>
  );
}
```

Switch `project.config.client` to `"swr"`, `"vue-query"`, `"svelte-query"`, `"axios"`, etc. to emit a different runtime.

### Axios / Fetch clients

When `client: "axios"` (or `"fetch"`) the template emits plain functions instead of hooks:

```ts
import { getPets } from "./src/pets/client";

const pets = await getPets({ params: { limit: 10 } });
```

Use `project.config.httpClient` or the `--http-client` flag to toggle between axios and fetch under the hood.

### Mock service worker (MSW)

Setting `mock` to an object enables MSW handler generation:

```jsonc
{
  "project": {
    "config": {
      "mock": { "type": "msw", "useExamples": true }
    }
  }
}
```

Generated handlers live under `mocks/handlers.ts` and can be wired into your application or test suite:

```ts
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";

const server = setupServer(...handlers);
```

Disable mocks per client with `clients[].config.mock = { "type": "off" }` or globally with `--mock-type off`.

## CLI overrides

| Flag | Effect |
|------|--------|
| `--http-client fetch` | Overrides `project.config.httpClient` regardless of config file. |
| `--client swr` | Emits SWR-compatible client calls. |
| `--mode split-tag` | Switches Orval’s output mode. |
| `--mock-type off` | Disables mock generation for the current run. |
| `--mock-delay 1000` | Sets a 1s artificial delay in the generated MSW handlers. |

## Rollup build & publishing

The template ships Rollup configuration that produces `dist/index.js` + `dist/index.d.ts`. Run `npm run build` inside the generated folder before publishing. The scaffolded `npm-publish` script honours `publish.npm` settings from the root config.

## Customising further

- Use `project.templateOptions.variables` to inject your own placeholder values inside template files.
- Override Orval entirely by providing a local template (`project.templateOptions.path`) while keeping the orchestrator workflow.
- Combine with hooks to run tests, linting, or custom bundling steps. Hooks run after dependency installation but before publishing automation.

## Resources

- [Unified generator config](../configuration/unified-generator-config.md)
- [Orval configuration reference](https://orval.dev) (cross-check with `.context/orval-output-api-options.md`)
- [MSW documentation](https://mswjs.io/)

With the unified interface you can flip between React Query, SWR, axios, or fetch clients—and enable/disable mocks—without touching template internals. The CLI handles the heavy lifting so you can focus on consuming the generated SDK.
