# GenxAPI Documentation Playbook

> Snapshot for future documentation upgrades. Keep this page in sync whenever docs evolve.

---

## Current Doc Set

| File | Purpose | Key Sections |
| ---- | ------- | ------------ |
| `README.md` | Landing page for the CLI. | Quickstart, feature overview, doc index. |
| `docs/getting-started.md` | First-run tutorial. | Installation, minimal config, output tree, Next → Configuration. |
| `docs/configuration.md` | Full config reference. | Discovery order, tables, JSON/YAML/TS samples, Next → CI. |
| `docs/ci-integration.md` | Pipeline automation. | GitHub Actions workflow, diff gate, other CI hints, Next → Templates. |
| `docs/templates.md` | Template/custom adapter guide. | Built-in structure, variable overrides, multi-language plan, Next → Versioning. |
| `docs/versioning.md` | Release strategy. | SemVer table, diff command usage, semantic-release integration, Next → Contributing. |
| `docs/contributing.md` | Project onboarding for contributors. | Scripts, guidelines, Conventional Commits, Next → Next Steps. |
| `docs/next-steps.md` | Roadmap & community. | Upcoming work, ecosystem extensions, pointers back to README. |

---

## Style Notes

- Frontmatter with `title` on every doc page.
- Callouts use `> 💡 Tip` and `> ⚠️ Warning`.
- Code blocks use explicit fences (`bash`, `json`, `yaml`, `ts`, etc.).
- Each page ends with a **Next** section linking to the logical continuation.
- Tone: friendly, hands-on, mirrors Orval docs.

---

## Future Enhancements

1. **Language-specific guides** – add `docs/python-adapter.md`/`docs/go-adapter.md` when adapters exit preview.
2. **Diff deep dive** – create a dedicated page once the command supports custom formatters.
3. **FAQ / Troubleshooting** – capture recurring support questions from Discussions.
4. **Site generation** – if ported to a static site (Docusaurus, Astro), reuse this structure for navigation.

---

_Last updated: 2025-10-18_
