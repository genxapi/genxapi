# @eduardoac/generate-api-client

CLI to scaffold, regenerate, synchronise, and release multiple API clients using Orval templates.

## Commands

- `generate-api-client generate` – Generate clients defined in configuration, optionally override the output directory (`--target`), initialise/synchronise a GitHub repository, and publish to npm.
- `generate-api-client publish` – Create GitHub releases using Octokit.

### Environment Variables

- `GITHUB_TOKEN` (configurable via `project.repository.tokenEnv`) – required to push commits or open pull requests.
- `NPM_TOKEN` (configurable via `project.publish.npm.tokenEnv`) – required to publish the generated package to npm.

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
