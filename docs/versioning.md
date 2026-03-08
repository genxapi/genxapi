---
title: "Versioning & Releases"
---

# Versioning & Releases

Consistent versioning keeps generated SDKs trustworthy. This guide separates the shipped release surface from the contract-aware workflow GenX API is intended to grow into.

## Current State

GenX API does **not** currently infer SemVer bumps from contract diffs.

Current shipped behaviour:

- Generated packages keep their own version in `package.json`.
- `generate` can publish to npm or GitHub Packages when `project.publish` enables those post-generation steps.
- `publish` creates a GitHub release when you pass explicit release metadata.
- Version choice for generated SDKs remains your responsibility or the responsibility of your surrounding release tooling.

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

```jsonc
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

With that setup, your generated package CI can run `semantic-release` after generation and review. GenX API does not manage that generated-package pipeline directly today.

## Planned Contract-Aware Release Flow

The intended later-phase workflow is broader than the current CLI surface. Planned behaviour includes:

- contract-aware change classification before generation or release
- release guidance that helps select major, minor, or patch bumps
- richer release metadata derived from contract and generated output
- CI-friendly summaries for reviewers and maintainers

Target workflow example:

1. Compare the previous and next API contracts.
2. Generate updated packages.
3. Produce a reviewer summary with changed files and contract impact.
4. Feed that information into package versioning and release tooling.
5. Publish packages and create GitHub releases with richer release notes.

This is target design context for upcoming phases, not shipped behaviour in the current CLI.

## Planned Semantic Diffing

GenX API does not ship a public `diff` command today. The following section describes the intended contract-aware workflow for later phases.

Target command shape:

```bash
npx genxapi diff \
  --base specs/petstore-v1.yaml \
  --head specs/petstore-v2.yaml \
  --format markdown \
  --output ./reports/petstore-diff.md
```

Target uses for that diff output:

- classify breaking and non-breaking contract changes
- feed PR summaries or reviewer guidance
- inform SemVer decisions in surrounding release tooling

Illustrative commit and release heuristics for later phases:

- `feat(api): add POST /pets` -> likely MINOR guidance
- `fix(api): correct schema for Pet.status` -> likely PATCH guidance
- breaking contract changes -> major-version guidance or explicit `!` commits in downstream tooling

Planned PR and release context may include:

- summary of generated files
- contract diff summary when first-class diff support lands
- guidance for reviewers on testing steps

## Planned CI Pattern

One intended later-phase CI flow is:

1. Run contract validation and diffing.
2. Generate packages with `genxapi generate`.
3. Open or update a review PR with generated changes and contract summary.
4. Let external tooling such as `semantic-release` or Release Please decide and publish the release.
5. Optionally use `genxapi publish` to create or enrich the GitHub release step.

Until those phases land, treat this as roadmap context rather than operational product guidance.

## Next Steps

- Learn how to contribute adapter logic or documentation in the [Contributing guide](./contributing.md).
- Explore the project roadmap in [Next Steps](./next-steps.md).

---

**Next:** [Contributing →](./contributing.md)
