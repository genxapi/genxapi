---
title: "Next Steps"
---

# Next Steps

Ready to go beyond the basics? This page outlines the roadmap and clearly labels the items that are still planned.

## Roadmap Highlights

1. **Deeper contract diffing** - add custom reporters, PR annotations, and stronger breaking-change analysis on top of the shipped `genxapi diff` command.
2. **Release intelligence** – move from manual review signals to stronger SemVer guidance and richer release metadata.
3. **Additional language workflows** – standardise post-generate scripts for Python, Go, .NET, and Java SDKs.
4. **Template ecosystem tooling** – improve authoring helpers, examples, and package ergonomics around the shipped external template contract.
5. **Insight dashboards** – aggregate run metadata (generation time, diff summaries) for platform teams.

None of the items above should be read as shipped functionality in the current release.

## Ecosystem Extensions

- **Action wrappers** – build reusable GitHub Actions that wrap the CLI with defaults for your organisation.
- **Marketplace publication** – revisit GitHub Marketplace only after the current action surface is mature enough to support broader adoption safely.
- **Spec validation** – integrate Spectral or OpenAPI validators in `hooks.beforeGenerate` to catch breaking changes early.
- **Release orchestration** – pair with semantic-release or Release Please to automate changelog generation across language ecosystems.
- **Documentation portals** – link generated READMEs to your internal developer portal or Backstage catalog.

## Adapting to Other Languages

Although the current first-party templates are TypeScript-focused, the architecture supports adapters:

- Use `template.path` to point at a Python, Go, or .NET project skeleton.
- Inject language-specific instructions via `templateVariables`.
- Add hook scripts to run language-specific package managers (`pip`, `poetry`, `dotnet`, `mvn`).

## Current vs Planned Reminder

Current release:

- Orchestration via `generate`
- Contract diffing via `diff`
- Release metadata via generation and release manifests
- GitHub release creation via `publish`
- First-party Orval and Kubb templates
- Explicit external template contract support

Planned later:

- Breaking vs non-breaking contract analysis
- Stronger contract-aware versioning guidance
- Additional template and ecosystem surfaces
- Marketplace publication once the action maturity checklist is satisfied

## Next Steps

- Revisit [Getting Started](./getting-started.md) when onboarding new teams.
- Deep-dive into [Configuration](./configuration.md) as specs grow.
- Jump to [Contributing](./contributing.md) to join development efforts.
- Return to the [README](../README.md) for an overview you can share with stakeholders.

---

**Return to:** [README →](../README.md)
