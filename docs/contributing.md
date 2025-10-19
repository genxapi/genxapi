---
title: "Contributing"
---

# Contributing

Thanks for helping improve the API client generator! This guide explains the contribution process, coding standards, and release workflow.

## Code of Conduct

Participation is governed by the [Contributor Covenant](../CONTRIBUTING.md). Be respectful, inclusive, and collaborative.

## Development Environment

```bash
git clone https://github.com/eduardoac/api-clients.git
cd api-clients
npm install
npm run build
```

> 💡 Tip: Run `npm run build --workspaces` after pulling main to keep template and CLI outputs in sync.

### Useful Scripts

| Script | Description |
| ------ | ----------- |
| `npm run build` | Builds the template and CLI. |
| `npm run test` | Runs Vitest suites for each workspace. |
| `npm run lint` | Lints all TypeScript sources. |
| `npm run typecheck` | Type-checks without emitting files. |
| `npm run clean` | Removes `dist/` folders across workspaces. |

## Project Structure

```text
packages/
├── orval-api-client-template/  # Orval adapter (schema + generateClients)
├── kubb-api-client-template/   # Kubb adapter
└── generate-api-client/        # CLI implementation, commands, unified schema
docs/                            # User-facing documentation (this folder)
examples/                        # Sample configs and generated outputs
samples/                         # Reference configuration files
```

## Coding Guidelines

- **TypeScript** – Target ES2022, enable strict mode, and prefer explicit return types.
- **Testing** – Add coverage to Vitest suites for new features. Use snapshot tests for template output when feasible.
- **Formatting** – Run `npm run format` before submitting. The repo enforces Prettier defaults (2 spaces, single quotes where applicable).
- **Commits** – Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`, `chore`, etc.). This keeps changelog automation reliable.

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
3. Publish packages (`npm run publish:template:npm`, `npm run publish:cli:npm`).
4. Tag the release (`git tag vX.Y.Z`) and push tags.
5. Optionally run `npx client-api-generator publish` to create a GitHub release.

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
