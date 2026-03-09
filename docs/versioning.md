---
title: "Versioning & Releases"
---

# Versioning & Releases

Consistent versioning keeps generated SDKs trustworthy. GenX API now ships contract-aware release signals, but the final version decision still stays with you or your surrounding release tooling.

## Current State

GenX API still does **not** automatically infer the final SemVer bump from contract diffs.

Current shipped behaviour:

- `diff` compares two OpenAPI documents and emits structured classification.
- Classification currently distinguishes `none`, `documentation`, `additive`, and `structural`.
- `additive` is exposed as a minor-version candidate, while `structural` requires manual review.
- `generate --release-manifest-output` can join generation planning metadata with diff metadata for CI traceability.
- Generated packages keep their own version in `package.json`.
- `generate` can publish to npm or GitHub Packages when `project.publish` enables those post-generation steps.
- `publish` creates a GitHub release when you pass explicit release metadata.
- The final version choice for generated SDKs remains your responsibility or the responsibility of your surrounding release tooling.

For this monorepo's own scoped packages, releases are now managed in CI with `semantic-release` plus a repo-local package-scoped commit filter.

## Generated Packages Today

Increment the package version before publishing:

```bash
npm version patch --workspace @genxapi/template-orval
npm version patch --workspace @genxapi/template-kubb
npm version patch --workspace @genxapi/cli
```

For generated SDK packages, bump the version in the generated package itself or let an external release tool handle it.

When `project.publish.npm.enabled` or `project.publish.github.enabled` is `true`, `generate` may publish the generated package as a post-generation action.

Recommended current flow:

1. Run `generate` against the current contract.
2. Review the generated package changes.
3. Bump or confirm the package version.
4. Publish the package, either through `project.publish` during generation or via your own package workflow.
5. Optionally call `publish` to create a GitHub release.

## Creating a GitHub Release Today

Use the `publish` command to create a GitHub release:

```bash
npx genxapi publish \
  --token ${GITHUB_TOKEN} \
  --owner acme \
  --repo petstore-sdk \
  --tag v1.4.0 \
  --title "v1.4.0"
```

You can wrap that in a project script if you want a shorter release command. This example assumes a POSIX shell:

```json
{
  "scripts": {
    "release:github": "genxapi publish --token $GITHUB_TOKEN --owner acme --repo petstore-sdk --tag v$npm_package_version --title \"Release $npm_package_version\""
  }
}
```

This command does not choose the version number for you and does not compute changelog entries from the contract.

## This Monorepo Today

The scoped packages published from this repository use merge-to-main automation:

- `@genxapi/cli`
- `@genxapi/template-orval`
- `@genxapi/template-kubb`

Current release behaviour:

- Conventional commits determine patch, minor, and major bumps.
- The repo-local package-scoped semantic-release plugin filters commits per package root so only relevant packages release.
- Releases create package-specific tags (`cli-vX.Y.Z`, `template-orval-vX.Y.Z`, `template-kubb-vX.Y.Z`) and GitHub releases.
- `genxapi` remains a manual proxy-package release from the maintainer laptop.

## External Tooling You Can Pair With Today

If you want automated versioning today, pair the generated package with your own release tooling, for example:

- [semantic-release](https://semantic-release.gitbook.io/semantic-release/)
- Release Please
- Changesets
- your own CI scripts

That automation lives in the generated package or consumer repository, not inside GenX API core.

Example `semantic-release` configuration for a generated package:

```json
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

With that setup, your generated package CI can run `semantic-release` after generation and review. GenX API does not manage that generated-package pipeline directly today.

## Current Contract-Aware Workflow

```bash
npx genxapi diff \
  --base ./contracts/petstore-before.json \
  --head ./contracts/petstore-after.json \
  --format json \
  --output ./artifacts/genxapi-diff.json \
  --release-manifest-output ./artifacts/genxapi-release.json

npx genxapi generate \
  --config ./genxapi.config.json \
  --dry-run \
  --plan-output ./artifacts/genxapi-plan.json \
  --release-manifest-output ./artifacts/genxapi-release.json
```

This gives you:

- a structured diff report
- a structured classification signal
- a generation plan
- one release manifest tying those artifacts together

See [Release lifecycle](./release-lifecycle.md) for the detailed workflow and classification meaning.

## Planned CI Pattern

One later-phase CI improvement path is:

1. Run contract validation and diffing with stronger structural analysis.
2. Generate packages with `genxapi generate`.
3. Open or update a review PR with generated changes and richer contract summary.
4. Let external tooling such as `semantic-release` or Release Please decide and publish the release.
5. Optionally use `genxapi publish` to create or enrich the GitHub release step.

## Next Steps

- Learn how to contribute adapter logic or documentation in the [Contributing guide](./contributing.md).
- Explore the project roadmap in [Next Steps](./next-steps.md).

---

**Next:** [Contributing →](./contributing.md)
