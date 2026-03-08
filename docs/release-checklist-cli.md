# Scoped Package Release Checklist

## Prerequisites

- Confirm the npm org/user owns `@genxapi/cli`, `@genxapi/template-orval`, and `@genxapi/template-kubb`.
- Configure npm trusted publishing per package:
  - `@genxapi/cli` trusts `.github/workflows/publish-cli.yml`
  - `@genxapi/template-orval` trusts `.github/workflows/publish-template-orval.yml`
  - `@genxapi/template-kubb` trusts `.github/workflows/publish-template-kubb.yml`
- Protect `main` if you want releases to happen only through merged PRs and not direct pushes.
- Use Conventional Commits in merged PRs so `semantic-release` can infer the correct version bump.

## Local dry run

```bash
npm run release:dry:cli
npm run release:dry:template-orval
npm run release:dry:template-kubb
```

## Merge-triggered releases

```bash
git push
```

After that, open a PR and merge it into `main`. `semantic-release` determines whether each scoped package needs a release from the merged commit history.

## CI publish

Merging a PR into `main` triggers the package-specific workflow for each scoped package:

- `.github/workflows/publish-cli.yml`
- `.github/workflows/publish-template-orval.yml`
- `.github/workflows/publish-template-kubb.yml`

Before the first semantic-release run, seed the current package tags once so the release history starts from the already-published versions:

```bash
git tag cli-v0.2.0
git tag template-orval-v0.1.1
git tag template-kubb-v0.1.0
git push origin cli-v0.2.0 template-orval-v0.1.1 template-kubb-v0.1.0
```

Current package tags:

- `cli-vX.Y.Z`
- `template-orval-vX.Y.Z`
- `template-kubb-vX.Y.Z`

Current release rules come from conventional commits:

- `fix:` -> patch release
- `feat:` -> minor release
- `BREAKING CHANGE:` or `!` -> major release

## Package workflow isolation

Each scoped package has its own semantic-release workflow so trusted publishing stays pinned to the matching workflow file. `semantic-release-monorepo` still analyzes commits independently per package root, but each workflow can publish only its own package.

## Optional proxy release

Publish `genxapi` separately only when the proxy package itself changes:

```bash
npm pack --workspace "genxapi" --dry-run
npm run publish -- --workspace genxapi --pkg-manager npm --access public
```

That proxy package is intentionally manual-only, published from your laptop when needed, and is not published by GitHub Actions.

## Post-publish validation

```bash
npm view @genxapi/cli version
npm view @genxapi/template-orval version
npm view @genxapi/template-kubb version
npx genxapi --help
npx @genxapi/cli --help
```
