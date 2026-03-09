---
title: "GitHub Action"
---

# Official GitHub Action

GenX API is the core product. The CLI remains the primary and most flexible surface for generation, diffing, manifests, orchestration, and package publication.

For GitHub workflow adoption, use the official [`genxapi-action`](https://github.com/genxapi/genxapi-action) wrapper repository. This is the recommended GitHub-facing surface and the right place for future Marketplace packaging and action-specific UX.

## Recommended GitHub usage

```yaml
- id: genx
  uses: genxapi/genxapi-action@main
  with:
    config: ./genxapi.config.json
    contract: ./openapi/petstore.yaml
    output-path: ./sdk/petstore-sdk
    dry-run: false
```

Use a pinned release tag from `genxapi-action` once you standardise the version you want in production workflows.

## When to use each path

- Use `genxapi-action` when your automation already lives in GitHub Actions and you want the official workflow wrapper with the most product-aligned entrypoint.
- Use the CLI directly when you need the most control, want to support multiple CI systems, or want manual install and invocation choices around GenX API.

## Direct CLI alternative

If you want the CLI without the action wrapper, prefer the human-facing command:

```bash
npx genxapi -- generate \
  --config ./genxapi.config.json \
  --contract ./openapi/petstore.yaml \
  --output-path ./sdk/petstore-sdk
```

## Migration note

Earlier documentation in this repository referenced a repository-root GitHub Action. That action surface now lives in `genxapi-action`.

This repository continues to document:

- the CLI
- configuration and templates
- contract-driven generation
- manifests, diffing, and orchestration
- generic automation patterns that apply beyond GitHub Actions

Action-specific inputs, outputs, release tags, and Marketplace packaging belong in the `genxapi-action` repository.

## Next steps

- Read [CI Integration](./ci-integration.md) for CLI-first automation guidance.
- Start from [Backend Package Generation workflow](./backend-package-generation.workflow.yml) for a GitHub Actions example built around the official wrapper.
