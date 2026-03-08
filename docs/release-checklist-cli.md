# CLI Release Checklist

## Prerequisites

- Confirm the npm org/user owns `@genxapi/cli`.
- Configure npm trusted publishing for `@genxapi/cli` to trust `.github/workflows/publish-cli.yml`.

## Local dry run

```bash
npm run build --workspace "@genxapi/cli"
npm pack --workspace "@genxapi/cli" --dry-run
npm publish --workspace "@genxapi/cli" --dry-run --access public
```

## Version + tag

```bash
npm version patch --workspace "@genxapi/cli" --no-git-tag-version

git add packages/cli/package.json
git commit -m "chore(release): bump cli to vX.Y.Z"
git tag cli-vX.Y.Z
git push
git push origin cli-vX.Y.Z
```

Alternatively, create an explicit tag:

```bash
git tag cli-vX.Y.Z
git push origin cli-vX.Y.Z
```

## CI publish

Pushing a `cli-v*` tag triggers the publish workflow and releases `@genxapi/cli`.

## Template package workflows

The scoped template packages publish through their own trusted-publishing workflows:

- `template-orval-vX.Y.Z` -> `.github/workflows/publish-template-orval.yml`
- `template-kubb-vX.Y.Z` -> `.github/workflows/publish-template-kubb.yml`

## Optional proxy release

Publish `genxapi` separately only when the proxy package itself changes:

```bash
npm pack --workspace "genxapi" --dry-run
npm run publish -- --workspace genxapi --pkg-manager npm --access public
```

That proxy package is intentionally manual-only, published from your laptop when needed, and is not published by GitHub Actions.

## Post-publish validation

```bash
npx genxapi --help
npx @genxapi/cli --help
```
