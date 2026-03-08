---
title: "Contributing"
---

# Contributing

Thanks for helping improve GenX API. This guide explains the contribution process, coding standards, and release workflow.

## Code of Conduct

Participation is governed by the [Contributor Covenant](../CONTRIBUTING.md). Be respectful, inclusive, and collaborative.

## Development Environment

```bash
git clone https://github.com/genxapi/genxapi.git
cd genxapi
npm install
npm run build:cli
npm run genxapi:cli -- --help
```

> 💡 Tip: Use `npm run build:cli` while iterating on CLI or template changes. Run `npm run build` when you want the full workspace build.

### Useful Scripts

| Script | Description |
| ------ | ----------- |
| `npm run build` | Builds the template and CLI. |
| `npm run build:cli` | Rebuilds the local CLI plus the in-repo templates it depends on. |
| `npm run genxapi:cli -- --help` | Runs the locally built CLI from the monorepo root. |
| `npm run genxapi:example:orval` | Regenerates the Orval sample into `examples/multi-client-demo`. |
| `npm run genxapi:example:kubb` | Regenerates the Kubb sample into `examples/multi-client-kubb`. |
| `npm run test` | Runs Vitest suites for each workspace. |
| `npm run lint` | Lints all TypeScript sources. |
| `npm run typecheck` | Type-checks without emitting files. |
| `npm run clean` | Removes `dist/` folders across workspaces. |
| `npm run pack:cli:smoke` | Verifies the packaged CLI tarball and bin entrypoints separately from the local dev flow. |

## Local CLI & Examples

Use the root `genxapi:*` scripts when validating CLI and template changes locally:

```bash
npm run build:cli
npm run genxapi:cli -- --help
```

`npm run genxapi:cli -- ...` is intentionally fast and assumes you have already run `npm run build:cli` after changing CLI or template code.

That repo-local shortcut is for monorepo development only. The public command surface remains `npx genxapi generate ...` and `npx genxapi publish ...`.

Dry-run both bundled configs before doing a real generation:

```bash
npm run genxapi:cli -- generate --config samples/orval-multi-client.config.json --template orval --dry-run
npm run genxapi:cli -- generate --config samples/kubb-multi-client.config.json --template kubb --dry-run
```

When you need the tracked examples refreshed, use the shortcut scripts:

```bash
npm run genxapi:example:orval
npm run genxapi:example:kubb
```

Those commands generate into `examples/multi-client-demo` and `examples/multi-client-kubb`. They also install dependencies inside each generated package because template `installDependencies` defaults to `true`.

To rerun the native generator from inside either example package:

```bash
cd examples/multi-client-demo
npm run generate-clients

cd ../multi-client-kubb
npm run generate-clients
```

Current caveats:

- The generated example packages do not currently ship `src/**/*.test.ts`, so `npm test` is not a useful validation step there yet.
- Real example generation and regeneration require network access because the sample configs fetch the live Swagger Petstore spec.
- `npm run genxapi:example:orval` and `npm run genxapi:example:kubb` rewrite tracked example directories, so review your diff after running them.

## Project Structure

```text
packages/
├── template-orval/  # Orval adapter (schema + generateClients)
├── template-kubb/   # Kubb adapter
└── cli/            # CLI implementation, commands, unified schema
docs/                            # User-facing documentation (this folder)
examples/                        # Sample configs and generated outputs
samples/                         # Reference configuration files
```

## Coding Guidelines

- **TypeScript**: Target ES2022, enable strict mode, and prefer explicit return types.
- **Testing**: Add coverage to Vitest suites for new features. Use snapshot tests for template output when feasible.
- **Formatting**: Run `npm run format` before submitting. The repo enforces Prettier defaults (2 spaces, single quotes where applicable).
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`, `chore`, etc.). This keeps changelog automation reliable.

> 🛠️ Tip: If you touch both template and CLI, split changes into separate commits for clarity.

## Pull Request Checklist

1. Tests pass locally (`npm test`).
2. Types compile (`npm run typecheck`).
3. Documentation updated when behaviour changes.
4. Run `npm version` if the change requires publishing a new template or CLI release.
5. Fill out the PR template with context, testing steps, and screenshots when relevant.

## Working on Documentation

- Update Markdown pages under `docs/`.
- Use callouts (`> 💡 Tip`) for noteworthy hints.
- Keep section titles in Title Case.
- Link to related pages using relative paths (`./configuration.md`).

## Releasing

1. Bump versions with `npm version <major|minor|patch> --workspace <package>`.
2. Commit the version bump and changelog updates.
3. Publish packages with the repository helper script. Examples:
   - `npm run publish -- --workspace @genxapi/template-orval --pkg-manager github`
   - `npm run publish -- --workspace @genxapi/cli --pkg-manager npm --access public`
4. Tag the release (`git tag vX.Y.Z`) and push tags.
5. Optionally run `npx genxapi publish --token <token> --owner <owner> --repo <repo> --tag vX.Y.Z` to create a GitHub release.

> ⚠️ Warning: npm disallows publishing over an existing version. Always increment versions before publishing from CI or locally.

## Getting Help

- Open a GitHub Discussion for feature ideas or questions.
- File issues with reproduction steps and configuration snippets.
- Join the roadmap conversation in [Next Steps](./next-steps.md).

Thank you for contributing! Your improvements help teams ship reliable SDKs faster.

## Next Steps

- Review the [Versioning guide](./versioning.md) to understand release expectations.
- Explore the [Next Steps roadmap](./next-steps.md) to see where help is most needed.

---

**Next:** [Next Steps →](./next-steps.md)
