---
title: "Next Steps"
---

# Next Steps

Ready to go beyond the basics? This page outlines the roadmap, ecosystem, and ways to extend the generator in your organisation.

## Roadmap Highlights

1. **Diff command enhancements** – expand `client-api-generator diff` with custom reporters and automated PR annotations.
2. **Python adapter** – ship an official adapter that builds wheels, publishes to PyPI, and mirrors README updates.
3. **Multi-language hooks** – standardise post-generate scripts for Go, .NET, and Java SDKs.
4. **Plugin API** – allow external packages to provide custom generators (e.g., GraphQL codegen) that run alongside Orval.
5. **Insight dashboards** – aggregate run metadata (generation time, diff summaries) for platform teams.

> 💡 Tip: Track progress via GitHub Projects in the repository. We triage issues weekly and tag them with `roadmap` when prioritised.

## Ecosystem Extensions

- **Action wrappers** – build reusable GitHub Actions that wrap the CLI with defaults for your organisation.
- **Spec validation** – integrate Spectral or OpenAPI validators in `hooks.beforeGenerate` to catch breaking changes early.
- **Release orchestration** – pair with semantic-release or Release Please to automate changelog generation across language ecosystems.
- **Documentation portals** – link generated READMEs to your internal developer portal or Backstage catalog.

## Adapting to Other Languages

Although TypeScript is the default, the architecture supports adapters:

- Use `template.path` to point at a Python, Go, or .NET project skeleton.
- Inject language-specific instructions via `templateVariables`.
- Add hook scripts to run language-specific package managers (`pip`, `poetry`, `dotnet`, `mvn`).

> 🧪 Note: We welcome contributions that add official adapters. Start by reading the [Templates guide](./templates.md) and propose your design in an issue.

## Community & Support

- **Discussions** – share use cases, ask questions, and vote on features.
- **Office hours** – monthly community calls (announced via GitHub Discussions) covering new releases and demos.
- **Slack/Discord** – join the community chat (invite link in repository README) for real-time support.

## Stay Involved

- Subscribe to repository releases to receive notifications when new versions of the template or CLI land.
- Help triage issues by reproducing bugs or verifying fixes.
- Contribute documentation improvements as you integrate the tooling.

## Next Steps

- Revisit [Getting Started](./getting-started.md) when onboarding new teams.
- Deep-dive into [Configuration](./configuration.md) as specs grow.
- Jump to [Contributing](./contributing.md) to join development efforts.
- Return to the [README](../README.md) for an overview you can share with stakeholders.
