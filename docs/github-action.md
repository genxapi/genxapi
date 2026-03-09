---
title: "GitHub Action"
---

# Official GitHub Action

GenX API is the core product. The CLI remains the primary and most flexible surface for generation, diffing, manifests, orchestration, and package publication.

For GitHub workflow adoption, use the official [`genxapi-action`](https://github.com/genxapi/genxapi-action) wrapper repository.

## When to use each path

- Use the CLI directly when you need the most control, want to support multiple CI systems, or need custom install and pinning choices around GenX API.
- Use `genxapi-action` when your automation already lives in GitHub Actions and you want the official workflow wrapper with less YAML.

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
- Start from [Backend Package Generation workflow](./backend-package-generation.workflow.yml) if you want a GitHub Actions example built around direct CLI usage.
