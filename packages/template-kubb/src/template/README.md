# __PROJECT_NAME__

This workspace contains the generated API client for __PROJECT_NAME__, produced by `@genxapi/cli`. It ships with Kubb, Rollup, and TypeScript tooling so the client can be regenerated, tested, and published with minimal setup.

## Prerequisites

- Node.js ≥ 20
- `npm` (or your preferred package manager)
- Optional tokens:
  - `NPM_TOKEN` if you publish this package.
  - `GITHUB_TOKEN` if you plan to push automated updates from CI.

## Install & Regenerate

```bash
npm install
npm run generate-clients
```

`npm run generate-clients` runs Kubb with the configuration found in `kubb.config.ts`. Edit that file (or rerun the generator) whenever your OpenAPI schema changes.

## Available Scripts

| Script | Description |
| ------ | ----------- |
| `npm run generate-clients` | Regenerates the API bindings via Kubb. |
| `npm run build` | Builds the distributable bundle (Rollup). |
| `npm test` | Runs the project’s Vitest suite. |
| `npm run clean` | Removes `dist/` output. |
| `npm run publish:npm` | Publish to npm as a private (restricted) package. |
| `npm run publish:npm-public` | Publish to npm publicly. |
| `npm run publish:github` | Publish to GitHub Packages. |

## Publishing

1. Ensure your `NPM_TOKEN` is configured (see the monorepo README for `.npmrc` details).
2. Bump the version in `package.json` as needed.
3. Run `npm run generate-clients` followed by `npm run build`.
4. Publish: `npm publish --access public`.

> Note: the generated project ships with an `.npmrc` that pins the registry to `https://registry.npmjs.org/` so dependencies such as `@kubb/cli` resolve even if your global config targets GitHub Packages.

## Customising

- Update `src/runtime/` if you need additional helper utilities around the generated SDK.
- Adjust `project.readme` in the config you pass to the generator to inject custom sections into this README on the next run.

## Need Help?

Open an issue in the upstream repository or contact the platform team that owns this client.
