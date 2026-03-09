---
title: "Release Lifecycle"
---

# Release Lifecycle

GenX API now has a supported contract-aware release workflow, but it is still intentionally incremental.

What is shipped today:

- `genxapi diff` compares two OpenAPI contracts and emits either a human-readable report or structured JSON.
- Diff results include machine-readable classification with the current supported levels:
  - `none`: no contract change detected
  - `documentation`: only doc-like fields changed after stripping descriptions, examples, and related metadata
  - `additive`: additions were detected without removals or other structural edits
  - `structural`: removals or non-doc structural edits were detected
- `genxapi generate --release-manifest-output ...` can write generation planning metadata into the same release manifest used by `diff`.
- `genxapi.manifest.json` still records generated-package traceability inside the package itself.

What is not shipped today:

- automatic SemVer selection
- reliable breaking vs non-breaking structural classification
- automatic release-note generation from contract and package diffs

## Current Classification Meaning

The current diff classification is intentionally honest about the depth of analysis:

| Level | Meaning today | Release signal |
| ----- | ------------- | -------------- |
| `none` | No diff entries were detected. | No version bump suggested. |
| `documentation` | Only documentation-like fields changed. | No version bump suggested. |
| `additive` | Additions were detected without removals or other structural edits. | Minor-version candidate, but still manual. |
| `structural` | Removals or non-doc edits were detected. | Manual review required. |

Important boundary: the `feat` / `fix` / `chore` summary type is a report label, not a final versioning decision.

## Release Manifest

The release manifest is a CI-friendly JSON document that can collect:

- diff metadata
- diff classification
- generation planning metadata
- next-step guidance for reviewers or automation

Typical usage:

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

This lets one artifact answer:

- what changed in the contract
- what generation plan or output corresponds to that change
- what should happen next in review or release handling

## Practical Workflow Today

1. Run `genxapi diff` against the previous and next contract.
2. Review the classification:
   - `additive` is a minor-version candidate
   - `structural` needs manual release review
3. Run `genxapi generate`, ideally with `--plan-output` and `--release-manifest-output`.
4. Review the generated package diff together with `genxapi.manifest.json` and the release manifest.
5. Choose the package version in your own release tooling or package workflow.
6. Publish the package and optionally call `genxapi publish` for the GitHub release.

## Boundaries

This workflow keeps the architecture boundaries intact:

- backend boundary: the OpenAPI contract remains the source of truth
- consumer boundary: release decisions still apply to the generated package interface
- template boundary: Orval and Kubb still own generator-specific richness
- core boundary: GenX API owns orchestration, metadata, classification reporting, and lifecycle traceability

## Next Phase

The next phase should deepen release intelligence rather than overstate it. The main gaps are:

- classify breaking versus compatible structural changes
- improve execution reporting after build or publish steps run
- support richer release notes and broader automation hooks without coupling to consumer repositories
