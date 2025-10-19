# Generate API Clients

Automate the creation, testing, and release of API clients across multiple projects. This monorepo contains:

- **`@eduardoac/generate-api-client`** — a CLI that orchestrates generation, repository automation, publishing, and release tooling.
- **`@eduardoac/api-client-template`** — an opinionated Orval-based template that produces production-ready SDK projects.

The tooling is designed for platform teams who maintain many API consumers and want consistent SDKs, automated pull requests, and CI-friendly workflows.

> 💡 Tip: The CLI reads configuration from `api-client-generatorrc.{json,yaml}` by default and works best on Node.js 20 or later.

## Key Features

- **One command, many clients** – generate multiple SDKs from a single config file, each with independent Orval settings.
- **Policy-driven releases** – push commits, open pull requests, and publish packages automatically with GitHub and npm integrations.
- **Template-first workflow** – customise scaffolding, README content, and template variables for each client or project.
- **CI/CD ready** – ship a drop-in GitHub Actions workflow (or any CI runner) that installs the CLI, caches artifacts, and runs smoke tests.
- **Language adapters** – TypeScript SDKs out of the box, with Python adapters on the roadmap and an extension API for additional languages.

## Quick Start

```bash
# Install dependencies for the monorepo
npm install

# Build the CLI and template
npm run build
```

Generate your first clients using the included sample configuration:

```bash
npx @eduardoac/generate-api-client generate \
  --config ./samples/multi-client.config.json \
  --log-level info
```

Set `GITHUB_TOKEN` and `NPM_TOKEN` environment variables to enable repository sync and package publishing.

## CLI Overview

| Command | Description | Common Flags |
| ------- | ----------- | ------------ |
| `generate` | Scaffold clients from config, run Orval, execute hooks, and sync with GitHub/npm. | `--config`, `--target`, `--dry-run`, `--log-level` |
| `publish` | Create GitHub releases for generated clients. | `--owner`, `--repo`, `--tag`, `--title`, `--body`, `--draft`, `--prerelease` |
| `diff` *(planned)* | Compare two OpenAPI specs and suggest semantic version bumps. | `--base`, `--head`, `--format`, `--output` |

Run `npx @eduardoac/generate-api-client --help` for the full CLI reference.

## Documentation

The `/docs` folder contains in-depth guides:

- [Getting Started](docs/getting-started.md) – install, configure, and run your first generation.
- [Configuration](docs/configuration.md) – full schema reference with JSON/YAML examples.
- [CI Integration](docs/ci-integration.md) – build reusable workflows across repositories.
- [Templates](docs/templates.md) – customise scaffolding and cross-language adapters.
- [Versioning](docs/versioning.md) – semantic release flows for generated SDKs.
- [Contributing](docs/contributing.md) – triage, code style, and release processes.
- [Next Steps](docs/next-steps.md) – roadmap and ecosystem integrations.

## Example Workflow

1. Copy the sample config and adjust paths:

   ```bash
   mkdir -p examples/petstore
   cp samples/multi-client.config.json examples/petstore/api-client-generatorrc.json
   ```

2. Edit `project.directory` and `clients[].output` so they point to your target folders.

3. Run the generator:

   ```bash
   GITHUB_TOKEN=ghp_xxx NPM_TOKEN=xxx \
   npx @eduardoac/generate-api-client generate \
     --config ./examples/petstore/api-client-generatorrc.json \
     --target ./examples/petstore/output
   ```

4. Review the generated SDK, run tests, and merge the automated pull request that the CLI opens in your repository.

> 🚀 The template installs dependencies, copies the OpenAPI spec, and runs Orval automatically unless you disable `project.runGenerate`.

## Learn More

- [Docs index](docs/getting-started.md) – start here for setup instructions.
- [Examples](examples/) – ready-to-run demos and sample configs.
- [Templates package](packages/api-client-template/) – customise generation behaviour.
- [CLI package](packages/generate-api-client/) – dive into the command implementation.

Happy generating! If you get stuck or want to contribute, jump to the [Contributing guide](docs/contributing.md).
