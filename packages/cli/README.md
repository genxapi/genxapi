# @genxapi/cli

CLI for GenX API orchestration. The current public command surface is intentionally small and explicit.

## Requirements

- Node.js **v20+**.
- Access tokens if you plan to push to GitHub (`GITHUB_TOKEN`) or publish to npm (`NPM_TOKEN`).

## Commands

- `genxapi generate` – Generate clients defined in configuration, optionally override the output directory (`--target`), and run configured post-generation GitHub or registry steps.
- `genxapi diff` – Compare two OpenAPI contracts, render a human-readable summary or JSON report, and optionally write release metadata.
- `genxapi publish` – Create GitHub releases using Octokit.

## Running the CLI

- Primary public alias: `npx genxapi --help`
- Direct package alternative: `npx @genxapi/cli --help`
- Local install: add `"cli": "genxapi"` to `package.json` scripts, then run `npm run cli -- --help`

### Environment Variables

- `GITHUB_TOKEN` (configurable via `project.repository.tokenEnv`) – required to push commits or open pull requests.
- `NPM_TOKEN` (configurable via `project.publish.npm.tokenEnv`) – required to publish the generated package to npm.

> Ensure `project.repository.owner` matches your GitHub login (case-insensitive). Leading `@` characters are stripped automatically before syncing.

Use `project.readme` in your configuration to customise the generated package README (introduction, usage text, extra sections).

<details>
  <summary>How to create a <code>GITHUB_TOKEN</code> with the correct permissions</summary>

1. Navigate to <em>Settings ▸ Developer settings ▸ Personal access tokens</em> in GitHub.
2. Create either:
   - a **Fine-grained token** scoped to the repos you will update and enable:
     - <strong>Repository permissions → Contents → Read and write</strong> (allows pushing commits and editing files)
     - <strong>Repository permissions → Pull requests → Read and write</strong>
   - or a **Classic token** and tick the single checkbox <strong>repo</strong> (minimal scope for commit + PR access).
3. Copy the token and export it as <code>GITHUB_TOKEN</code> before running the generator.

</details>
<details>
  <summary>How to create an <code>NPM_TOKEN</code> with publish rights</summary>

1. Sign in to <a href="https://www.npmjs.com/">npmjs.com</a>.
2. Go to <em>Access Tokens</em> and click <em>Generate new token</em>.
3. Choose an <strong>Automation</strong> or <strong>Publish</strong> token (Automation is recommended for CI).
4. Copy the token and export it as <code>NPM_TOKEN</code> before running the generator.

</details>

### Sample Usage

```bash
GITHUB_TOKEN=ghp_xxx NPM_TOKEN=xxx \
genxapi generate \
  --config samples/orval-multi-client.config.json \
  --target ./examples/multi-client-demo \
  --log-level debug
```

This command will:

1. Load the config (including repository/publish settings) from the provided path or cosmiconfig search.
2. Call `@genxapi/template-orval` to scaffold the template, apply replacements, copy swagger files, run Orval, and execute hooks.
3. Commit and push the generated changes to GitHub and open a pull request if `project.repository` exists.
4. Publish the package if `project.publish.npm.enabled` is `true`.

Contract diff example:

```bash
genxapi diff \
  --base ./contracts/petstore-prev.json \
  --head ./contracts/petstore-next.json \
  --format json \
  --output ./artifacts/genxapi-diff.json \
  --release-manifest-output ./artifacts/genxapi-release.json
```

Generation can append planning metadata to the same release manifest:

```bash
genxapi generate \
  --config ./genxapi.config.json \
  --dry-run \
  --plan-output ./artifacts/genxapi-plan.json \
  --release-manifest-output ./artifacts/genxapi-release.json
```

### Type safety

Run `npm run typecheck` at the repository root to validate both packages before raising a PR or publishing.

### Publishing the CLI

From the repository root:

```bash
# Dry-run the repository release configuration locally
npm run release:dry:cli
```

The published npm release for `@genxapi/cli` is handled by `semantic-release` from `.github/workflows/publish-cli.yml` after merge to `main`. The `genxapi` proxy package remains a separate manual release.
