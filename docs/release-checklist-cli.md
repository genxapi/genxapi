# CLI Release Checklist

## Prerequisites

- Confirm the npm org/user owns `@genxapi/cli` and the name is available.
- Decide on publishing auth:
  - Trusted publishing (recommended): configure npm to trust this GitHub repo.
  - Token fallback: add `NPM_TOKEN` as a GitHub Actions secret.

## Local dry run

```bash
npm run build --workspace "@genxapi/cli"
npm pack --workspace "@genxapi/cli" --dry-run
npm publish --workspace "@genxapi/cli" --dry-run --access public
```

## Version + tag

```bash
npm version patch --workspace "@genxapi/cli"
# or edit packages/cli/package.json manually

git push
git push --tags
```

Alternatively, create an explicit tag:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

## CI publish

Pushing a `v*` tag triggers the publish workflow and releases `@genxapi/cli`.

## Post-publish validation

```bash
npx @genxapi/cli --help
```

Note: `npx genxapi --help` is only expected if the unscoped `genxapi` package is also published separately.
