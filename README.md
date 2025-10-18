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

## Automation Hooks

- Add a `repository` section to your configuration to let the CLI initialise a GitHub repository, push commits, and open pull requests automatically. Provide a `GITHUB_TOKEN` with `repo` scope.
- Enable `publish.npm.enabled` to run `npm publish` (or your preferred package manager) after generation. Provide an `NPM_TOKEN` with publish rights.
