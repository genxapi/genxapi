# GenX API

This package is the primary public alias for the GenX API command.

## Primary Usage

Use `genxapi` when you want the easiest command to type and remember:

```bash
npx genxapi --help
```

Examples:

```bash
npx genxapi generate --config ./genxapi.config.json --log-level info
npx genxapi publish --token ${GITHUB_TOKEN} --owner acme --repo petstore-sdk --tag v1.0.0
```

This package delegates to the latest `@genxapi/cli`.

## Relationship to `@genxapi/cli`

- `genxapi` is the primary alias and public-facing command package.
- `@genxapi/cli` remains the direct installable package.
- Both expose the same CLI surface.
- `genxapi` does not add extra commands; it forwards to `@genxapi/cli`.

## 🔗 Links

- Website: https://genxapi.dev
- Repository: https://github.com/genxapi/genxapi
- CLI package: @genxapi/cli

## 🔎 Keywords

API client generation, API orchestration, client release automation, OpenAPI tooling, TypeScript codegen, GenX API.

## 📦 Node Support

Node.js 20 or higher required.

## Licence

This project is licensed under the Apache License 2.0.

See the [LICENSE](./LICENSE) file for details.

Copyright 2025-2026 Eduardo Aparicio Cardenes.
