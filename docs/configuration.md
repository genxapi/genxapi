---
title: "Configuration Reference"
---

# Configuration Reference

`generate-api-client` reads configuration from `api-client-generatorrc.json` (or `.yaml`) and drives the entire automation workflow. This page documents every option, default value, and advanced tweak.

## File Discovery

The CLI resolves configuration in the following order:

1. `api-client-generatorrc`
2. `api-client-generatorrc.json`
3. `api-client-generatorrc.yaml` / `.yml`
4. `api-client-generator.config.json`
5. `api-client-generator.config.yaml` / `.yml`

Use `--config <path>` to load an explicit file.

> 💡 Tip: Add the `$schema` reference at the top of your JSON file to enable IntelliSense in VS Code and other editors.

## Top-Level Structure

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/eduardoac/api-clients/main/schemas/generate-api-client.schema.json",
  "logLevel": "info",
  "project": { /* ProjectConfig */ },
  "clients": [ /* ClientConfig[] */ ],
  "hooks": { /* Hook scripts */ }
}
```

### `logLevel`

| Type | Default | Description |
| ---- | ------- | ----------- |
| `"silent" \| "error" \| "warn" \| "info" \| "debug"` | `"info"` | Controls CLI logging verbosity. Override via `--log-level` flag. |

## Project Configuration

```jsonc
"project": {
  "name": "multi-client-demo",
  "directory": "./examples/multi-client-demo",
  "packageManager": "npm",
  "runGenerate": true,
  "template": {
    "name": "@eduardoac/api-client-template",
    "path": "./templates/custom",
    "variables": {
      "organization": "Acme",
      "openSource": "true"
    },
    "installDependencies": true
  },
  "repository": { /* RepositoryConfig */ },
  "publish": { /* PublishConfig */ },
  "readme": { /* Generated README content */ }
}
```

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `name` | `string` | – | Human-readable identifier for logs and PR titles. |
| `directory` | `string` | – | Relative path where the template is scaffolded. Accepts `./` or `../` prefixes. |
| `packageManager` | `"npm" \| "pnpm" \| "yarn" \| "bun"` | `"npm"` | Controls lockfile creation and install commands executed by the template. |
| `runGenerate` | `boolean` | `true` | Skip Orval execution when set to `false` (useful for validating configs in CI). |
| `template.name` | `string` | `"@eduardoac/api-client-template"` | Template package installed from npm or a workspace. |
| `template.path` | `string` | `undefined` | Absolute or relative path to a custom template folder. Overrides `template.name`. |
| `template.variables` | `Record<string,string>` | `{}` | Arbitrary key/value pairs injected into template files (e.g., README placeholders). |
| `template.installDependencies` | `boolean` | `true` | Controls `npm install` (or equivalent) execution after scaffolding. |
| `repository` | `RepositoryConfig` | `undefined` | Enables GitHub automation, including repository creation and pull requests. |
| `publish` | `PublishConfig` | `{}` | Enables npm publishing. |
| `readme` | `ProjectReadmeConfig` | `undefined` | Customises README sections inside the generated project. |

### Repository Automation

```jsonc
"repository": {
  "owner": "acme",
  "name": "petstore-sdk",
  "defaultBranch": "main",
  "create": true,
  "commitMessage": "chore: update generated clients",
  "tokenEnv": "GITHUB_TOKEN",
  "pullRequest": {
    "enabled": true,
    "branchPrefix": "chore/clients",
    "title": "chore: refresh generated clients",
    "body": "Automated update via generate-api-client."
  }
}
```

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `owner` | `string` | – | GitHub username or organisation. Leading `@` is stripped automatically. |
| `name` | `string` | – | Repository name. |
| `defaultBranch` | `string` | `"main"` | Base branch used for pull requests. |
| `create` | `boolean` | `true` | Create the repository if it does not exist (requires authenticated user with permissions). |
| `commitMessage` | `string` | `"chore: update generated client"` | Commit message for generated changes. |
| `tokenEnv` | `string` | `"GITHUB_TOKEN"` | Environment variable that holds the personal access token. |
| `pullRequest.enabled` | `boolean` | `true` | Disable to push directly to branch without PRs. |
| `pullRequest.branchPrefix` | `string` | `"update/generated-client"` | Branch name prefix used for automation. |
| `pullRequest.title` | `string` | `"chore: update generated client"` | Pull request title. |
| `pullRequest.body` | `string` | Default template text | Pull request description. |

> 📘 Note: Provide a token with `repo` scope (classic) or `Contents` + `Pull requests` write access (fine-grained) to allow pushing and PR creation.

### npm Publishing

```jsonc
"publish": {
  "npm": {
    "enabled": true,
    "tag": "latest",
    "access": "public",
    "dryRun": false,
    "tokenEnv": "NPM_TOKEN",
    "registry": "https://registry.npmjs.org/",
    "command": "npm"
  }
}
```

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `enabled` | `boolean` | `false` | Publish the generated package after successful generation. |
| `tag` | `string` | `"latest"` | npm dist-tag used when publishing. |
| `access` | `"public" \| "restricted"` | `"public"` | Publish visibility. `restricted` keeps packages private (GitHub Packages, npm org). |
| `dryRun` | `boolean` | `false` | Run `npm publish --dry-run` without uploading artifacts. |
| `tokenEnv` | `string` | `"NPM_TOKEN"` | Environment variable containing npm automation token. |
| `registry` | `string` | `undefined` | Custom registry URL (e.g., GitHub Packages). |
| `command` | `"npm" \| "pnpm" \| "yarn" \| "bun"` | `"npm"` | CLI used to execute the publish command. |

### README Customisation

```jsonc
"readme": {
  "introduction": "Generated SDK for the Petstore API.",
  "usage": "npm install @acme/petstore-sdk",
  "additionalSections": [
    {
      "title": "Regeneration",
      "body": "Run `npm run generate-clients` to refresh the SDK."
    }
  ]
}
```

## Client Configuration

Each entry in `clients[]` describes a single API client.

```jsonc
{
  "name": "pets",
  "swagger": "./specs/pets.yaml",
  "copySwagger": true,
  "swaggerCopyTarget": "swagger/pets.yaml",
  "output": {
    "workspace": "./src/pets",
    "target": "./src/pets/client.ts",
    "schemas": "./src/pets/model"
  },
  "templateVariables": {
    "serviceName": "Pets"
  },
  "orval": {
    "mode": "split",
    "client": "react-query",
    "baseUrl": "https://api.pets.local",
    "mock": true,
    "prettier": true,
    "clean": true
  }
}
```

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `name` | `string` | – | Identifier used in directory names and logging. |
| `swagger` | `string` | – | HTTP/HTTPS URL or local file path to the OpenAPI spec. |
| `copySwagger` | `boolean` | `true` | Copy the OpenAPI document into the generated project. |
| `swaggerCopyTarget` | `string` | `"swagger-spec.json"` | Path inside the project where the spec is copied. |
| `templateVariables` | `Record<string,string>` | `{}` | Overrides or extends template placeholders for this client only. |
| `output.workspace` | `string` | `"./src"` | Base directory passed to Orval's `output.workspace`. |
| `output.target` | `string` | `"./src/client.ts"` | Client entry file produced by Orval. |
| `output.schemas` | `string` | `"model"` | Directory suffix for schema models. |
| `orval.*` | – | See Orval docs | Passed directly to Orval's configuration for the client. |

## Hook Scripts

```jsonc
"hooks": {
  "beforeGenerate": ["npm run lint"],
  "afterGenerate": ["npm test", "npm run format"]
}
```

Hooks run inside the generated project directory:

- `beforeGenerate` executes after scaffolding but before Orval runs.
- `afterGenerate` runs once Orval completes and before GitHub/npm automation triggers.

Use them to run code mods, copy additional assets, or invoke language-specific build steps.

> 🛠️ Tip: Hooks leverage `execa`, so they inherit environment variables and stream output directly to your terminal/CI logs.

## Environment Variables

| Variable | Purpose |
| -------- | ------- |
| `GITHUB_TOKEN` (or custom `repository.tokenEnv`) | Enables repository creation, pushes, and pull request automation. |
| `NPM_TOKEN` (or custom `publish.npm.tokenEnv`) | Grants permission to publish packages to npm or private registries. |
| `CI` | When set, the template skips interactive prompts and uses non-TTY spinners/log output. |

## Example YAML Configuration

```yaml
$schema: https://raw.githubusercontent.com/eduardoac/api-clients/main/schemas/generate-api-client.schema.json
logLevel: debug
project:
  name: billing-sdk
  directory: ./sdks/billing
  packageManager: pnpm
  template:
    name: "@eduardoac/api-client-template"
    variables:
      owner: acme
  repository:
    owner: acme
    name: billing-sdk
    defaultBranch: main
    pullRequest:
      branchPrefix: chore/billing-client
      title: "chore: refresh billing client"
  publish:
    npm:
      enabled: true
      tag: next
      access: restricted
      registry: https://npm.pkg.github.com/
clients:
  - name: billing
    swagger: https://api.acme.dev/billing/openapi.yaml
    output:
      workspace: ./src/billing
      target: ./src/billing/client.ts
hooks:
  afterGenerate:
    - pnpm run lint
    - pnpm run test
```

## Next Steps

- Move on to [CI Integration](./ci-integration.md) to wire the CLI into GitHub Actions.
- Explore [Templates](./templates.md) to customise scaffolding and add new language adapters.
