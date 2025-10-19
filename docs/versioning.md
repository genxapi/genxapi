---
title: "Versioning & Releases"
---

# Versioning & Releases

Consistent versioning keeps generated SDKs trustworthy. This guide covers semantic versioning, changelog automation, and release workflows using `generate-api-client`.

## Semantic Versioning Principles

We follow [SemVer](https://semver.org/):

- **MAJOR** – backward-incompatible changes (removed endpoints, breaking schema changes).
- **MINOR** – new functionality (new endpoints, optional fields).
- **PATCH** – bug fixes or doc-only changes.

> 💡 Tip: Automate SemVer bump detection by analysing OpenAPI diffs (see [Semantic Diffing](#semantic-diffing)).

## Managing Versions in the Template

The template stores its version in `package.json` and `package-lock.json`. Increment the version before publishing:

```bash
npm version patch --workspace @eduardoac/api-client-template
npm version patch --workspace @eduardoac/generate-api-client
```

Update dependent workspaces if you bump major versions.

## Automating Generated SDK Releases

The generator publishes SDKs when `project.publish.npm.enabled` is `true`. Recommended flow:

1. Run the generator in CI with the latest API spec.
2. Inspect the generated diff (automated PR).
3. Merge the PR; CI runs `npm publish` with the version already bumped.
4. Tag releases using the `publish` command or your own release tooling.

### Sample Release Script

Add to your generated repo:

```jsonc
{
  "scripts": {
    "release": "generate-api-client publish --owner acme --repo petstore-sdk --tag v$npm_package_version --title \"Release $npm_package_version\""
  }
}
```

## Changelog Automation

Use conventional commits or semantic-release inside the generated project. The generator’s automated PR includes:

- Summary of generated files.
- Swagger diff summary (when `diff` integration is enabled).
- Guidance for reviewers on testing steps.

Integrate [semantic-release](https://semantic-release.gitbook.io/semantic-release/) by adding:

```jsonc
{
  "release": {
    "branches": ["main"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      [
        "@semantic-release/npm",
        {
          "npmPublish": false
        }
      ],
      "@semantic-release/github"
    ]
  }
}
```

CI runs semantic-release after the generator merges changes, producing GitHub releases and changelog entries.

## Semantic Diffing

The upcoming `diff` command compares two OpenAPI specs and categorises changes:

```bash
npx @eduardoac/generate-api-client diff \
  --base specs/petstore-v1.yaml \
  --head specs/petstore-v2.yaml \
  --format markdown \
  --output ./reports/petstore-diff.md
```

Suggested commit messages:

- `feat(api): add POST /pets` → triggers MINOR bump.
- `fix(api): correct schema for Pet.status` → triggers PATCH bump.
- Breaking changes produce `fix!` or `feat!` with SemVer major hints.

> 🚧 Note: Until the CLI command is released, import `analyzeSwaggerDiff` from `packages/generate-api-client/src/utils/swaggerDiff` to integrate diff checks manually.

## Tagging Releases with the CLI

Use the `publish` command to create GitHub releases (changelog text is optional):

```bash
npx @eduardoac/generate-api-client publish \
  --token ${GITHUB_TOKEN} \
  --owner acme \
  --repo petstore-sdk \
  --tag v1.4.0 \
  --title "v1.4.0" \
  --body "$(cat CHANGELOG.md)" \
  --prerelease
```

Combine this with semantic-release or run it manually after reviewing generated changes.

## Handling Multiple Languages

- TypeScript SDKs use npm semver. Keep the version in sync with changelog entries.
- Python adapters (preview) will use `pyproject.toml` and follow [PEP 440](https://peps.python.org/pep-0440/). Mirror semantic intent even if the format differs (`1.4.0`, `1.4.0b1`, etc).
- Document version strategy in your generated README so consumers know how to interpret updates.

## Next Steps

- Learn how to contribute adapter logic or documentation in the [Contributing guide](./contributing.md).
- Explore the project roadmap in [Next Steps](./next-steps.md).
