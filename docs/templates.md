---
title: "Templates & Adapters"
---

# Templates & Adapters

Templates define the project structure that every generated client inherits. Adapters extend the core TypeScript experience to additional languages such as Python, with Go and .NET on the roadmap.

## Template Overview

`@eduardoac/api-client-template` ships with a production-ready TypeScript project that includes:

- Rollup build pipeline with declaration bundling.
- Dual ESM/CJS entry points for Node and bundler compatibility.
- Preconfigured testing via Vitest.
- README and changelog scaffolding.
- Environment-ready `.npmrc` and `tsconfig` files.

The generator copies the template into `project.directory`, applies variables, runs Orval, and executes hooks.

```text
src/template/
├── package.json
├── README.md
├── rollup.config.mjs
├── tsconfig.json
├── tsconfig.build.json
├── src/
│   ├── index.ts
│   └── runtime/
│       └── create-client.ts
└── scripts/
    └── postinstall.ts
```

> 📁 Note: The template folder above lives inside the package. When using a custom template, mimic this structure.

## Customising Template Variables

Define global variables inside `project.template.variables` and client-specific overrides with `clients[].templateVariables`. Variables use `{{variableName}}` placeholders throughout the template.

```jsonc
"project": {
  "template": {
    "variables": {
      "company": "Acme Corp",
      "docsUrl": "https://docs.acme.dev"
    }
  }
},
"clients": [
  {
    "name": "billing",
    "templateVariables": {
      "serviceName": "Billing API"
    }
  }
]
```

Inside a template file:

```md
# {{serviceName}}

Welcome to the {{company}} SDK!

> 💡 Full documentation: {{docsUrl}}
```

Global variables fall back when a client does not override them.

## Using a Local Template

Point `project.template.path` to a local directory:

```jsonc
"project": {
  "template": {
    "path": "./templates/python-sdk",
    "installDependencies": false
  }
}
```

- The folder is resolved relative to the configuration file.
- `installDependencies` is often disabled for non-Node templates; run language-specific installers in `hooks.afterGenerate`.

## TypeScript Adapter Details

The default template includes:

- `src/index.ts` entry that re-exports generator utilities.
- `rollup.config.mjs` bundling runtime and types.
- Orval configuration files in `orval.config.ts` for multi-client generation.
- Runtime utilities under `src/runtime`, including `create-client.ts`.

Extend the template by editing `packages/api-client-template/src/template`. Run `npm run build --workspace @eduardoac/api-client-template` to propagate changes into `dist/template`.

## Python Adapter (Preview)

Python support is planned through an adapter structure:

```text
python-adapter/
├── pyproject.toml.ejs
├── README.md.ejs
├── src/
│   └── __init__.py.ejs
└── hooks/
    └── post-generate.sh
```

Recommended configuration pattern:

```jsonc
"clients": [
  {
    "name": "orders",
    "swagger": "./specs/orders.yaml",
    "templateVariables": {
      "language": "python",
      "packageName": "acme_orders"
    }
  }
],
"hooks": {
  "afterGenerate": [
    "pip install -r requirements.txt",
    "pytest"
  ]
}
```

> 🚧 Note: Python adapters are under active development. Follow the [Next Steps](./next-steps.md) guide to join the preview or contribute an adapter.

## Mixing Multiple Templates

Use different templates per client by pointing to distinct paths and toggling variables:

```jsonc
"clients": [
  {
    "name": "typescript",
    "swagger": "./specs/core.yaml",
    "templateVariables": { "language": "typescript" }
  },
  {
    "name": "python",
    "swagger": "./specs/core.yaml",
    "templateVariables": { "language": "python" },
    "output": {
      "workspace": "./python-sdk",
      "target": "./python-sdk/client.py"
    }
  }
]
```

In your template files, branch on `{{language}}` to adjust README instructions or build scripts.

## Automating README & Scripts

Leverage `project.readme` and hooks to keep documentation in sync:

```jsonc
"project": {
  "readme": {
    "introduction": "SDK that wraps the Billing API.",
    "usage": "pnpm add @acme/billing-sdk",
    "additionalSections": [
      {
        "title": "Python Usage",
        "body": "pip install acme-billing-sdk"
      }
    ]
  }
},
"hooks": {
  "afterGenerate": [
    "pnpm run lint",
    "pnpm run test",
    "pnpm run build"
  ]
}
```

The template merges these values into the generated README so downstream repos receive tailored documentation automatically.

## Testing Template Changes

1. Modify files under `packages/api-client-template/src/template`.
2. Run `npm run build --workspace @eduardoac/api-client-template`.
3. Execute `npx client-api-generator generate --config ./samples/multi-client.config.json`.
4. Inspect the output and run the generated project’s test suite.

> 🧪 Tip: Use `npm run test --workspace @eduardoac/api-client-template` to lint and type-check template code before publishing updates.

## Next Steps

- Understand how SDK releases stay consistent in the [Versioning guide](./versioning.md).
- Ready to contribute adapters? Read the [Contributing guide](./contributing.md).
