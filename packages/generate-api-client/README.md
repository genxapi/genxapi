# @eduardoac/generate-api-client

CLI to scaffold and generate multiple API clients using Orval templates.

## Commands

- `generate-api-client generate` – Generate clients defined in configuration, optionally initialise/synchronise a GitHub repository and publish to npm.
- `generate-api-client publish` – Create GitHub releases using Octokit.

### Environment Variables

- `GITHUB_TOKEN` (configurable via `project.repository.tokenEnv`) – required to push commits or open pull requests.
- `NPM_TOKEN` (configurable via `project.publish.npm.tokenEnv`) – required to publish the generated package to npm.
