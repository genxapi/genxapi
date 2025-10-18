# @eduardoac/generate-api-client

CLI to scaffold, regenerate, synchronise, and release multiple API clients using Orval templates.

## Requirements

- Node.js **v20+** (required by Orval's Commander dependency; older runtimes will emit engine warnings).
- Access tokens if you plan to push to GitHub (`GITHUB_TOKEN`) or publish to npm (`NPM_TOKEN`).

## Commands

- `generate-api-client generate` – Generate clients defined in configuration, optionally override the output directory (`--target`), initialise/synchronise a GitHub repository, and publish to npm.
- `generate-api-client publish` – Create GitHub releases using Octokit.

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
generate-api-client generate \
  --config examples/petstore/api-client-generator.config.json \
  --target ./examples/petstore/output \
  --log-level debug
```

This command will:

1. Load the config (including repository/publish settings) from the provided path or cosmiconfig search.
2. Call `@eduardoac/api-client-template` to scaffold the template, apply replacements, copy swagger files, run Orval, and execute hooks.
3. Commit and push the generated changes to GitHub and open a pull request if `project.repository` exists.
4. Publish the package if `project.publish.npm.enabled` is `true`.

### Semantic-release examples

After running the generator, you can compare swagger revisions and generate a commit message for semantic-release:

```bash
# Compare swagger files and classify the change
node --input-type=module -e "import base from './packages/generate-api-client/src/utils/swaggerDiff/fixtures/base.json' assert { type: 'json' };
import { analyzeSwaggerDiff } from './packages/generate-api-client/src/utils/swaggerDiff/index.js';
const next = structuredClone(base);
next.paths['/pets/{id}'] = { get: { operationId: 'getPet', responses: { '200': { description: 'single pet' } } } };
console.log(analyzeSwaggerDiff(base, next));"
```

This prints the commit suggestion (`feat`, `fix`, or `chore`) that feeds semantic-release version bumps.

### Type safety

Run `npm run typecheck` at the repository root to validate both packages before raising a PR or publishing.
