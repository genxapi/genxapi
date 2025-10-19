---
title: "Configuration Reference"
---

# Configuration Reference

`client-api-generator` reads a declarative configuration file (`api-client-generatorrc.json`, `.yaml`, or `.ts`) and turns it into a repeatable workflow. This guide documents every option, default value, and pattern for structuring your repositories.

## File Resolution Order

Configuration is discovered in the current working directory in this order:

1. `api-client-generatorrc`
2. `api-client-generatorrc.json`
3. `api-client-generatorrc.yaml` / `.yml`
4. `api-client-generatorrc.ts`
5. `api-client-generator.config.json`
6. `api-client-generator.config.yaml` / `.yml`

Override the path with `--config <path>` when running the CLI.

> 💡 Tip: Add the `$schema` directive to JSON configs or import `CliConfig` in TypeScript configs to unlock editor IntelliSense and validation.

## Top-Level Fields

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/eduardoac/api-clients/main/schemas/generate-api-client.schema.json",
  "logLevel": "info",          // optional: silent | error | warn | info | debug
  "project": { /* ProjectConfig */ },
  "clients": [ /* ClientConfig[] */ ],
  "hooks": { /* Hook scripts */ }
}
```

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `logLevel` | `"silent" \| "error" \| "warn" \| "info" \| "debug"` | `"info"` | Controls CLI verbosity. Override with `--log-level`. |
| `project` | `ProjectConfig` | – | Defines template behaviour, repositories, and publishing policy. |
| `clients` | `ClientConfig[]` | – | One or more OpenAPI specifications to process. |
| `hooks` | `HookConfig` | `{}` | Optional commands executed before/after generation. |

## Project Configuration

```jsonc
"project": {
  "name": "multi-client-demo",
  "directory": "./examples/multi-client-demo",
  "packageManager": "npm",
  "runGenerate": true,
  "template": {
    "name": "@eduardoac/api-client-template",
    "path": "./templates/custom",   // optional override
    "variables": {
      "organization": "Acme Corp",
      "docsUrl": "https://docs.acme.dev"
    },
    "installDependencies": true
  },
  "repository": { /* RepositoryConfig */ },
  "publish": { /* PublishConfig */ },
  "readme": { /* ProjectReadmeConfig */ }
}
```

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `name` | `string` | – | Human-readable identifier used in logs, branch names, and PR titles. |
| `directory` | `string` | – | Relative path for the generated project. Accepts `./` and `../`. |
| `packageManager` | `"npm" \| "pnpm" \| "yarn" \| "bun"` | `"npm"` | Determines the install command executed by the template. |
| `runGenerate` | `boolean` | `true` | Skip Orval execution when `false`. Useful for dry runs or external orchestration. |
| `template.name` | `string` | `"@eduardoac/api-client-template"` | Package used as the base template. |
| `template.path` | `string` | `undefined` | Local template directory. Overrides `template.name` when provided. |
| `template.variables` | `Record<string,string>` | `{}` | Key/value pairs injected into template placeholders. |
| `template.installDependencies` | `boolean` | `true` | Controls whether the template runs `npm install` (or equivalent). |
| `repository` | `RepositoryConfig` | `undefined` | Enables GitHub repository automation. |
| `publish` | `PublishConfig` | `{}` | npm (or registry) publishing settings. |
| `readme` | `ProjectReadmeConfig` | `undefined` | Custom README content injected into the template. |

### Repository Automation

```jsonc
"repository": {
  "provider": "github",
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
    "body": "Automated updates via client-api-generator."
  }
}
```

| Field | Default | Description |
| ----- | ------- | ----------- |
| `provider` | `"github"` | Future-proofed for additional providers. |
| `owner` | – | GitHub user or organisation (leading `@` is stripped). |
| `name` | – | Repository name. |
| `defaultBranch` | `"main"` | Base branch for pull requests. |
| `create` | `true` | Create the repository if it does not exist (requires authenticated user permissions). |
| `commitMessage` | `"chore: update generated client"` | Commit message for automated updates. |
| `tokenEnv` | `"GITHUB_TOKEN"` | Environment variable containing the PAT. |
| `pullRequest.enabled` | `true` | Set to `false` to push directly to the branch. |
| `pullRequest.branchPrefix` | `"update/generated-client"` | Prefix used when creating automation branches. |
| `pullRequest.title` | `"chore: update generated client"` | Default PR title. |
| `pullRequest.body` | template string | Body text for the PR description. |

> ⚠️ Warning: Tokens must include `contents:write` and `pull_requests:write` (fine-grained PAT) or the classic `repo` scope and cannot be GitHub Actions default tokens when creating new repositories.

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

| Field | Default | Description |
| ----- | ------- | ----------- |
| `enabled` | `false` | Publish the generated package when `true`. |
| `tag` | `"latest"` | npm dist-tag. Use `next`, `beta`, etc. for prereleases. |
| `access` | `"public"` | `"restricted"` for private/customer registries. |
| `dryRun` | `false` | Executes `npm publish --dry-run`. Recommended for CI smoke tests. |
| `tokenEnv` | `"NPM_TOKEN"` | Environment variable storing the automation token. |
| `registry` | `undefined` | Overrides the registry (e.g., `https://npm.pkg.github.com/`). |
| `command` | `"npm"` | Use `pnpm`, `yarn`, or `bun` in monorepos aligned to those tools. |

### README Customisation

```jsonc
"readme": {
  "introduction": "Generated SDK for the Petstore API.",
  "usage": "npm install @acme/petstore-sdk",
  "additionalSections": [
    {
      "title": "Regeneration",
      "body": "Run `npm run generate-clients` whenever the OpenAPI spec changes."
    }
  ]
}
```

## Client Configuration

Each client entry maps to one OpenAPI document.

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
    "serviceName": "Pets API"
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

| Field | Default | Description |
| ----- | ------- | ----------- |
| `name` | – | Logical identifier used for logging and folder naming. |
| `swagger` | – | URL or relative file path to the OpenAPI document. |
| `copySwagger` | `true` | Copies the document into the generated project. |
| `swaggerCopyTarget` | `"swagger-spec.json"` | Destination path within the project. |
| `templateVariables` | `{}` | Overrides template placeholders for this client only. |
| `output.workspace` | `"./src"` | Passed to Orval as `output.workspace`. |
| `output.target` | `"./src/client.ts"` | Client entry point produced by Orval. |
| `output.schemas` | `"model"` | Schema folder suffix under the workspace. |
| `orval` | `{}` | Forwarded verbatim to Orval. Refer to [orval.dev](https://orval.dev/) for the full option set. |

## Hooks

```jsonc
"hooks": {
  "beforeGenerate": ["npm run lint"],
  "afterGenerate": ["npm test", "npm run format"]
}
```

Hooks execute inside `project.directory`:

- `beforeGenerate` runs after scaffolding but before Orval.
- `afterGenerate` runs after Orval and before GitHub/npm automation.

Use them to run Spectral validation, code formatting, or language-specific packaging scripts.

> 🛠️ Tip: Hooks stream output directly via `execa`. If a hook exits non-zero the generation halts, preventing invalid artifacts from shipping.

## Environment Variables

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `GITHUB_TOKEN` (or custom `repository.tokenEnv`) | Optional | Enables repository creation, pushing commits, and opening pull requests. |
| `NPM_TOKEN` (or custom `publish.npm.tokenEnv`) | Optional | Authenticates npm (or private registry) publishing. |
| `CI` | Optional | When set, spinners and prompts adapt to non-interactive environments. |

## Example YAML Config

```yaml
$schema: https://raw.githubusercontent.com/eduardoac/api-clients/main/schemas/generate-api-client.schema.json
logLevel: debug
project:
  name: billing-sdk
  directory: ./sdks/billing
  packageManager: pnpm
  repository:
    owner: acme
    name: billing-sdk
    pullRequest:
      branchPrefix: chore/billing-client
      title: "chore: refresh billing client"
  publish:
    npm:
      enabled: true
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

## Example TypeScript Config

```ts
import type { CliConfig } from "client-api-generator/config";

const config: CliConfig = {
  logLevel: "debug",
  project: {
    name: "orders-sdk",
    directory: "./sdks/orders",
    template: {
      name: "@eduardoac/api-client-template",
      variables: {
        company: "Acme",
        docsUrl: "https://docs.acme.dev/orders"
      }
    }
  },
  clients: [
    {
      name: "orders",
      swagger: "./specs/orders.yaml",
      output: {
        workspace: "./src/orders",
        target: "./src/orders/client.ts"
      }
    }
  ],
  hooks: {
    afterGenerate: ["npm run lint", "npm run test"]
  }
};

export default config;
```

> 💡 Tip: Co-locate configs with service specs (e.g., `services/orders/api-client-generatorrc.ts`). Pass `--config` in CI to target the right file.

## Versioning-Friendly Layouts

- Keep generated SDKs in dedicated folders (`./sdks/<service>`). This isolates lockfiles and changelogs.
- Store OpenAPI specs alongside config files. The upcoming `diff` command can be pointed at `specs/current.yaml` vs. `specs/next.yaml`.
- Commit generated artifacts when you rely on pull-request based workflows; otherwise add them to `.gitignore` and publish from CI-only builds.

## Next Steps

- Wire everything into pipelines with [CI Integration →](./ci-integration.md).
- Customise output scaffolding through the [Templates guide →](./templates.md).
