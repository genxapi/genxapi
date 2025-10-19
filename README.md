# client-api-generator

> Automate, orchestrate, and release SDKs — bring your favourite generators.

`client-api-generator` is a meta-orchestrator that delivers the “client API generator” experience without locking you to a single engine. It discovers your OpenAPI-driven configuration, coordinates code generation for multiple clients, enforces semantic versioning, and pushes releases to GitHub and npm without bespoke scripts. First-party templates currently bundle Orval and Kubb adapters, and you can layer in custom engines through hooks or bespoke templates.

> 💡 Configuration lives in `api-client-generatorrc.{json,ts}`. Commit it so local runs and CI pipelines stay aligned.

---

## Why this orchestrator exists

Maintaining a fleet of SDKs is labour-intensive. Specs drift faster than client code, release steps are repetitive, and CI pipelines are brittle. This project keeps the moving parts aligned so teams can ship client updates confidently and repeatedly:

- **Single source of truth** for generation, versioning, and publishing.
- **Consistent automation** across repositories and CI providers.
- **Extensible workflow** that composes existing generators rather than replacing them.

---

## What it does

- Discovers multi-client configs and invokes the generators defined by your templates—shipped ones include Orval/Kubb adapters, but you can register alternatives—so the orchestrator still behaves like a full client API generator at the workflow level.
- Applies reusable templates, hooks, and post-processing to keep scaffolded clients uniform.
- Calculates semantic version bumps from OpenAPI diffs and writes changelog metadata.
- Commits, pushes, and raises pull requests; creates GitHub releases; publishes to public or private npm registries.
- Runs headless inside CI/CD, honouring cache layers and environment variables such as `GITHUB_TOKEN` and `NPM_TOKEN`.

## What it does not do

- Replace your chosen code generators (e.g. Orval, Kubb, OpenAPI Generator).
- Provide runtime HTTP layers or opinionated API consumption utilities.
- Offer a graphical dashboard (the focus is CLI and automation tooling).
- Deploy generated projects beyond packaging and publishing.

---

## Spec → Generate → Publish

```
┌────────────┐    configure     ┌─────────────┐    orchestrate    ┌──────────────┐
│ OpenAPI    │ ──► config file ─► client-api- │ ──► git/npm ▷ ci ─► Released SDK │
│ documents  │                   generator    │                    artefacts     │
└────────────┘                    (CLI)        └─────────────┬────┴──────────────┘
                                                              │
              delegates generation to template-backed engines ◄──────────┘
```

---

## Quickstart

Install the orchestrator alongside whichever first-party template you plan to use:

```bash
# Orval template
npm install --save-dev client-api-generator @eduardoac/api-client-template

# Kubb template
npm install --save-dev client-api-generator @eduardoac/kubb-client-template
```

Create a starter config and generate clients locally:

```bash
cp samples/multi-client.config.json ./api-client-generatorrc.json
npx client-api-generator generate --log-level info

# Switch templates on the fly
npx client-api-generator generate --template kubb --log-level info

Aliases: `orval` → `@eduardoac/api-client-template` (default), `kubb` → `@eduardoac/kubb-client-template`.
```

Dry-run a release to verify GitHub and npm connectivity:

```bash
GITHUB_TOKEN=ghp_xxx NPM_TOKEN=npm_xxx \
  npx client-api-generator publish --dry-run
```

---

## Command reference

| Command | Summary | Frequent flags |
| ------- | ------- | -------------- |
| `generate` | Generates clients, runs hooks, and prepares Git changes. | `--config`, `--target`, `--template`, `--dry-run`, `--log-level` |
| `publish` | Creates GitHub releases and publishes packages. | `--owner`, `--repo`, `--tag`, `--title`, `--body`, `--draft`, `--prerelease` |
| `diff` | Compares two OpenAPI documents and classifies breaking changes. | `--base`, `--head`, `--format`, `--output` |

Run `npx client-api-generator --help` to see every option and sub-command.

---

## CI/CD example

```yaml
# .github/workflows/clients.yml
name: Refresh SDKs

on:
  schedule:
    - cron: "0 6 * * 1"
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx client-api-generator generate --log-level info
      - run: npx client-api-generator publish --dry-run
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## When to use it

- You maintain multiple SDKs (internal or public) and need reproducible releases.
- You already define APIs with OpenAPI and want automated feedback on breaking changes.
- You prefer infrastructure-as-code for delivery pipelines and avoid bespoke shell scripts.

Start with the [Getting Started guide](docs/getting-started.md) to wire the orchestrator into your workflow in under ten minutes.

---

## Further reading

- [Configuration reference](docs/configuration.md)
- [CI integration](docs/ci-integration.md)
- [Templates & adapters](docs/templates.md)
- [Versioning & releases](docs/versioning.md)
- [Contributing](docs/contributing.md)
- [Next steps & roadmap](docs/next-steps.md)
### Templates and generators

- **TypeScript template (Orval)** — ships with the monorepo and remains the default starting point.
- **Language adapters (Kubb)** — optional packages give access to Python, Go, .NET, and other outputs.
- **Custom engines** — wire in additional generators by extending the template folder or calling them from hooks.

Templates are versioned alongside the orchestrator so teams can upgrade the workflow without rewriting scripts.
