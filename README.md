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

> **Requirement:** Orval 7.x depends on Commander 14 which targets Node v20+. Running the generator on Node 18 works but prints engine warnings; upgrade to Node 20 for a clean run.

To generate clients (with GitHub + npm automation):

```bash
npx @eduardoac/generate-api-client generate --config ./samples/multi-client.config.json
```

- Provide `GITHUB_TOKEN` and/or `NPM_TOKEN` (or custom env vars via config) to enable repository sync and npm publishing.
- See `samples/multi-client.config.json` for repository/publish configuration examples.
  <details>
  <summary>Generate a <code>GITHUB_TOKEN</code> with the correct permissions</summary>

1. Visit <em>GitHub ▸ Settings ▸ Developer settings ▸ Personal access tokens</em>.
2. Choose either:
   - **Fine-grained token** scoped to the repositories you will update. In the permission tree select:
     - <strong>Repository permissions → Contents → Read and write</strong> (allows git pushes and file updates)
     - <strong>Repository permissions → Pull requests → Read and write</strong> (required to open PRs)
   - **Classic token** and tick the single checkbox <strong>repo</strong> (which implicitly enables push + PR access).
3. Copy the token value and export it as <code>GITHUB_TOKEN</code> before running the generator.

  </details>
  <details>
    <summary>Generate an <code>NPM_TOKEN</code> with publish rights</summary>

1. Log in to <a href="https://www.npmjs.com/">npmjs.com</a>.
2. Go to <em>Access Tokens</em> and click <em>Generate New Token</em>.
3. Choose <strong>Automation</strong> (recommended for CI) or <strong>Publish</strong> token type.
4. Copy the token and export it as <code>NPM_TOKEN</code> before running the generator.

  </details>

## Publishing

```bash
npm run npm-publish --workspace @eduardoac/api-client-template
npm run npm-publish --workspace @eduardoac/generate-api-client
```

## Automation Hooks

- Add a `repository` section to your configuration to initialise or synchronize a GitHub repository, push commits, and open pull requests automatically.
- `project.repository.owner` should match your GitHub login (case-insensitive; leading <code>@</code> is ignored automatically).
- Configure `publish.npm` to publish the generated client with npm, pnpm, yarn, or bun.
- Hooks integrate with `execa`, so custom before/after commands run in the generated project directory.

## Example Walkthrough

1. Copy `samples/multi-client.config.json` into your own repo and adjust the paths:

```bash
mkdir -p examples/petstore
cp samples/multi-client.config.json examples/petstore/api-client-generator.config.json
```

2. Edit the config so `project.directory` points to a writable folder (e.g. `./examples/petstore/output`) and update `repository.owner/name` if you want automatic GitHub sync.

3. Run the generator (optionally overriding the target directory with `--target`):

```bash
GITHUB_TOKEN=ghp_xxx NPM_TOKEN=xxx \
npx @eduardoac/generate-api-client generate \
  --config examples/petstore/api-client-generator.config.json \
  --target ./examples/petstore/output \
  --log-level info
```

This will:

- Scaffold the template into `project.directory`.
- Apply template variables, copy swagger files, and run Orval (unless `runGenerate` is false).
- Execute any hooks.
- Push changes to GitHub and open a pull request if `repository` is configured.
- Publish the generated package if `publish.npm.enabled` is `true`.

4. Inspect the generated project (e.g. under `examples/petstore/output`) to review artefacts or run additional commands (`npm test`, `npm run build`, etc.). The generator already installs dependencies and runs Orval using the remote Petstore schema.
