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

To generate clients (with GitHub + npm automation):

```bash
npx @eduardoac/generate-api-client generate --config ./samples/multi-client.config.json
```

- Provide `GITHUB_TOKEN` and/or `NPM_TOKEN` (or custom env vars via config) to enable repository sync and npm publishing.
- See `samples/multi-client.config.json` for repository/publish configuration examples.

## Publishing

```bash
npm run npm-publish --workspace @eduardoac/api-client-template
npm run npm-publish --workspace @eduardoac/generate-api-client
```

## Automation Hooks

- Add a `repository` section to your configuration to initialise or synchronize a GitHub repository, push commits, and open pull requests automatically.
- Configure `publish.npm` to publish the generated client with npm, pnpm, yarn, or bun.
- Hooks integrate with `execa`, so custom before/after commands run in the generated project directory.

## Example Walkthrough

1. Copy `samples/multi-client.config.json` into your own repo and adjust the paths:

```bash
mkdir -p examples/petstore
cp samples/multi-client.config.json examples/petstore/api-client-generator.config.json
```

2. Edit the config so `project.directory` points to a writable folder (e.g. `./examples/petstore/output`) and update `repository.owner/name` if you want automatic GitHub sync.

3. Run the generator:

```bash
GITHUB_TOKEN=ghp_xxx NPM_TOKEN=xxx \
npx @eduardoac/generate-api-client generate \
  --config examples/petstore/api-client-generator.config.json \
  --log-level info
```

This will:

- Scaffold the template into `project.directory`.
- Apply template variables, copy swagger files, and run Orval (unless `runGenerate` is false).
- Execute any hooks.
- Push changes to GitHub and open a pull request if `repository` is configured.
- Publish the generated package if `publish.npm.enabled` is `true`.

4. Inspect the generated project (e.g. under `examples/petstore/output`) to review artefacts or run additional commands (`npm test`, `npm run build`, etc.).
