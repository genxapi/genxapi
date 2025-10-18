# @eduardoac/api-clients

Monorepo that hosts:

- `@eduardoac/api-client-template` – reusable Orval-based project template for generating type-safe API clients.
- `@eduardoac/generate-api-client` – CLI for orchestrating multi-client generation and release automation.

## Getting Started

```bash
npm install
npm run build
npm test
```

To generate clients:

```bash
npx @eduardoac/generate-api-client generate --config ./samples/multi-client.config.json
```

## Publishing

```bash
npm run npm-publish --workspace @eduardoac/api-client-template
npm run npm-publish --workspace @eduardoac/generate-api-client
```
