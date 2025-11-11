# GenxAPI

> Automate, orchestrate, and publish SDKs — client api generation faster..

`GenxAPI` is a meta-orchestrator that delivers the “client API generator” experience without locking you to a single engine. It discovers your OpenAPI-driven configuration, coordinates code generation for multiple clients, enforces semantic versioning, and pushes releases to GitHub and npm without bespoke scripts. First-party templates currently bundle Orval and Kubb adapters, and you can layer in custom engines through hooks or bespoke templates.

> 💡 Configuration lives in `genxapi.config.{json,ts}`. Commit it so local runs and CI pipelines stay aligned.

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
│ OpenAPI    │ ──► config file ─►   GenxAPI   │ ──► git/npm ▷ ci ─► Released SDK │
│ documents  │                   (CLI binary) │                    artefacts     │
└────────────┘                                  └─────────────┬────┴──────────────┘
                                                              │
              delegates generation to template-backed engines ◄──────────┘
```

---

## Quickstart

Install the orchestrator alongside the template package you intend to drive:

```bash
# Orval template
npm install --save-dev @genxapi/cli @genxapi/template-orval

# Kubb template
npm install --save-dev @genxapi/cli @genxapi/template-kubb
```

Create a unified config and generate clients locally:

```bash
cp samples/orval-multi-client.config.json ./genxapi.config.json
npx genxapi generate --log-level info

# Switch engines or override behaviour at runtime
npx genxapi generate \
  --template kubb \
  --http-client fetch \
  --mode split-tag \
  --mock-type msw

# Aliases resolved by the CLI
#   orval → @genxapi/template-orval (default)
#   kubb  → @genxapi/template-kubb
```

### Try the bundled samples

Run either sample directly from the repo to see the unified config in action:

```bash
# Orval-flavoured demo (generates into examples/multi-client-demo)
npx genxapi generate \
  --config samples/orval-multi-client.config.json \
  --log-level info

# Kubb-flavoured demo (generates into examples/multi-client-kubb)
npx genxapi generate \
  --config samples/kubb-multi-client.config.json \
  --log-level info

# Validate configs without writing files
npx genxapi generate \
  --config samples/orval-multi-client.config.json \
  --dry-run
```

Dry-run a release to verify GitHub and npm connectivity:

```bash
GITHUB_TOKEN=ghp_xxx NPM_TOKEN=npm_xxx \
npx genxapi publish --dry-run
```

### Unified publish command

Publishing every workspace now funnels through a single helper script that understands registry presets, access levels, and workspace aliases. From the repo root run:

```bash
# Publish the Orval template to the default (GitHub Packages) destination
NPM_TOKEN=xxx npm run publish -- --template template-orval

# Ship the CLI publicly to npmjs.org
NPM_TOKEN=xxx npm run publish -- --workspace @genxapi/cli --pkg-manager npm --access public

# Perform a dry-run with an explicit config file
NPM_TOKEN=xxx npm run publish -- \
  --config scripts/publish.orval.json \
  --dry-run
```

Key flags:

- `--workspace` / `--template` – choose the package (aliases include `template-orval`, `template-kubb`, `cli`).
- `--pkg-manager` or `--registry` – pick a preset (`npm`, `github`) or provide a full registry URL.
- `--access` – toggle `public` vs `restricted`.
- `--tag`, `--token-env`, `--command`, `--dry-run`, `--otp` – fine‑tune publish behaviour.
- `--config <file>` – merge additional JSON config, useful when generators emit publish metadata alongside the generated project.

Defaults live in the root `genxapiPublish` block, so template-generated projects can provide their own publish settings without coding bespoke scripts. You can list available packages with `npm run publish -- --list`.

> Need to publish directly from a workspace? Each package still ships with a plain `npm publish` script, keeping the package self-contained while the unified helper remains available at the repo root.

#### How `genxapiPublish` works

The root `package.json` exposes a `genxapiPublish` section that layers configuration for the helper:

- `defaults` – baseline values (command, tag, token variable) that apply to every workspace.
- `presets` – shortcuts such as `npm` or `github` that expand into registry/access pairs; you can add more to target other registries.
- `aliases` – human-friendly names (`template-orval`, `cli`, etc.) that the CLI resolves to real workspace package names.
- `workspaces` – per-package overrides (e.g. locking templates to GitHub Packages while leaving the CLI free to override at runtime).

The helper merges these layers with any config file you pass (`--config path/to/file.json`) and command-line flags. Template generators can emit JSON payloads with publish settings; drop that file alongside the generated project and invoke `npm run publish -- --config generated-publish.json` to honour whatever the template decided.

---

## Command reference

| Command | Summary | Frequent flags |
| ------- | ------- | -------------- |
| `generate` | Generates clients, runs hooks, and prepares Git changes. | `--config`, `--target`, `--template`, `--dry-run`, `--log-level` |
| `publish` | Creates GitHub releases and publishes packages. | `--owner`, `--repo`, `--tag`, `--title`, `--body`, `--draft`, `--prerelease` |
| `diff` | Compares two OpenAPI documents and classifies breaking changes. | `--base`, `--head`, `--format`, `--output` |

Run `npx genxapi --help` to see every option and sub-command.

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
      - run: npx genxapi generate --log-level info
      - run: npx genxapi publish --dry-run
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Website

The public landing page lives in the `website/` folder and is deployed via the `.github/workflows/deploy-website.yml` workflow. Update that directory (and the workflow inputs) if the hosting platform changes—no other parts of the repo depend on a specific provider.

---

## When to use it

- You maintain multiple SDKs (internal or public) and need reproducible releases.
- You already define APIs with OpenAPI and want automated feedback on breaking changes.
- You prefer infrastructure-as-code for delivery pipelines and avoid bespoke shell scripts.

Start with the [Getting Started guide](docs/getting-started.md) to wire the orchestrator into your workflow in under ten minutes.

---

## Further reading

- [Unified configuration](docs/configuration/unified-generator-config.md)
- [CI integration](docs/ci-integration.md)
- [Templates & adapters](docs/templates.md)
- [Versioning & releases](docs/versioning.md)
- [Contributing](docs/contributing.md)
- [Next steps & roadmap](docs/next-steps.md)
### Templates and generators

- **Orval template (`@genxapi/template-orval`)** — the default adapter for TypeScript + React Query workflows. [Usage guide](docs/templates/orval-api-client-template.md).
- **Kubb template (`@genxapi/template-kubb`)** — exposes the Kubb plugin ecosystem for multi-language SDKs. [Usage guide](docs/templates/kubb-api-client-template.md).
- **Custom engines** — wire in additional generators by extending templates or invoking them from lifecycle hooks.

Templates are versioned alongside the orchestrator so teams can upgrade the workflow without rewriting scripts.
