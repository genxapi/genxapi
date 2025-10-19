# client-api-generator

> Automate API client generation, publishing, and versioning — from OpenAPI schemas to ready-to-use SDKs.

`client-api-generator` helps teams automate API client creation and publishing. It supports generation, diffing, and versioning directly from OpenAPI schemas. From a single config you can scaffold SDKs, open pull requests, publish to npm, and verify schema differences across releases.

> 💡 Tip: The CLI discovers `api-client-generatorrc.{json,ts}` in your repository root. Keep configs in source control so CI runs match local results.

## Why it exists

Maintaining API clients across multiple services is tedious:

- Specs drift faster than hand-written code.
- Pull requests pile up with generated churn.
- Publishing requires ceremony and guarded credentials.

`client-api-generator` solves this by orchestrating:

- Orval-powered TypeScript templates (with adapters for Python, Go, .NET on the roadmap).
- GitHub repository automation (commits, pull requests, releases).
- npm or internal registry publishing with semantic versioning.
- CI-friendly commands that run headless and play nicely with caches.

## 🚀 Quickstart

```bash
npm install --save-dev client-api-generator

npx client-api-generator --help
```

Scaffold your first SDK:

```bash
cp samples/multi-client.config.json ./api-client-generatorrc.json
npx client-api-generator generate --log-level info
```

Set `GITHUB_TOKEN` and `NPM_TOKEN` environment variables to enable GitHub sync and npm publishing.

## Commands at a glance

| Command | Description | Common Flags |
| ------- | ----------- | ------------ |
| `generate` | Generates clients, applies templates, runs hooks, syncs to GitHub/npm. | `--config`, `--target`, `--dry-run`, `--log-level` |
| `publish` | Creates GitHub releases for generated packages. | `--owner`, `--repo`, `--tag`, `--title`, `--body`, `--draft`, `--prerelease` |
| `diff` | Compares two OpenAPI specs and reports breaking changes. | `--base`, `--head`, `--format`, `--output` |

Run `npx client-api-generator --help` for more options.

1. Add an `api-client-generatorrc.json` file at your project root.
2. Run the generator to create your first client: `npx client-api-generator generate`.
3. Integrate it in CI/CD to automate updates and publishing.

---

## 📘 Documentation

- [Getting Started →](docs/getting-started.md)
- [Configuration Reference →](docs/configuration.md)
- [CI Integration →](docs/ci-integration.md)
- [Templates & Adapters →](docs/templates.md)
- [Versioning & Releases →](docs/versioning.md)
- [Contributing →](docs/contributing.md)
- [Next Steps & Roadmap →](docs/next-steps.md)

## When to use it

- You ship multiple SDKs and want reproducible releases.
- You already write OpenAPI specs and need fast feedback on schema changes.
- You operate in a CI-first environment (GitHub Actions, GitLab CI, CircleCI, etc.).

If that sounds familiar, dive into [Getting Started](docs/getting-started.md) and generate your first client in under 10 minutes.

---

> 💡 **Next:** [Start with the Getting Started guide →](docs/getting-started.md)
