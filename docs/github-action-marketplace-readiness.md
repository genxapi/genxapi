---
title: "GitHub Action Marketplace Readiness"
---

# GitHub Action Marketplace Readiness

This review is about whether the repository-root GitHub Action is mature enough for Marketplace publication. It is not an automatic publish plan.

## Current Decision

Recommendation: publish later, not now.

Reason:

- The action surface is useful and documented, but it still behaves like a product-integrated automation entrypoint rather than a Marketplace-ready standalone action.
- The current maturity is strong enough for direct repository usage and tagged release consumption.
- Marketplace publication should wait until the action has a clearer support contract, stronger action-specific verification, and tighter UX/documentation around long-term public adoption.

## Checklist

### Documentation

Current state:

- Inputs and outputs are documented in [CI integration](./ci-integration.md).
- Example workflows exist for dry runs and backend-triggered generation.
- The boundary model is documented clearly.

Still needed before Marketplace publication:

- A dedicated troubleshooting section for common action failures.
- Version-pinning guidance centered on release tags, not `@main`.
- A clearer compatibility/support policy for Node versions, CLI versions, and template versions.

Status: partially ready.

### Supportability

Current state:

- The action wraps a narrow CLI surface.
- The repository already publishes the CLI and first-party templates through workflows.
- The action outputs a useful plan artifact for debugging CI runs.

Still needed before Marketplace publication:

- Action-focused integration tests that exercise the composite action itself, not just the CLI.
- A documented support matrix and deprecation policy.
- Clear ownership for action-specific bug triage and response expectations.

Status: not ready enough for Marketplace scale.

### Security

Current state:

- The action is composite and keeps secrets in environment variables.
- Publish automation is opt-in and can be disabled per workflow.
- Contract and plan logging already redact secrets in the CLI path.

Current concerns:

- The action installs the CLI dynamically with `npx -p`, which is acceptable for repository use but deserves stricter hardening guidance before Marketplace promotion.
- `cli-version` is flexible, which is useful operationally but expands the support and trust surface.
- External templates are now loaded through an explicit contract, but action users still need stronger guidance on trusting third-party templates in CI.

Still needed before Marketplace publication:

- Action-specific security guidance for permissions, pinning, and third-party template trust.
- A clearer statement on supported trust model and provenance expectations.

Status: functional, but not Marketplace-hardened.

### UX

Current state:

- Inputs and outputs are explicit and machine-friendly.
- Dry-run behaviour is useful and honest.
- The action stays within GenX API core boundaries instead of inventing repository magic.

Still needed before Marketplace publication:

- Simpler starter workflows for the most common use cases.
- Action branding and Marketplace-facing positioning.
- Tighter naming and examples for users who are not already familiar with GenX API concepts.

Status: solid for existing users, not yet optimized for broad Marketplace discovery.

## Publish Gate

Treat Marketplace publication as a later phase after these conditions are met:

1. The action has dedicated integration coverage.
2. Tagged-release examples replace `@main` in primary docs.
3. Support policy and compatibility expectations are documented.
4. Security guidance covers permissions, pinning, and third-party template trust.
5. The UX is simplified for teams adopting the action without prior GenX API context.

## What Is Recommended Today

- Keep shipping and documenting the action in-repo.
- Encourage users to pin tagged releases directly from GitHub.
- Re-evaluate Marketplace publication after the action surface and support model mature further.
