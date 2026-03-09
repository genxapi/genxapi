---
title: "Custom Template Guidance"
---

# Custom Template Guidance

There are three different customization paths in GenX API. Choose the smallest one that solves your problem without weakening the architecture.

## 1. Built-in Templates

Use a built-in template when Orval or Kubb already models the generator you need.

Good fit:

- You want the default GenX API path.
- You only need documented Orval or Kubb capabilities.
- You want the strongest compatibility with current docs and examples.

Examples:

- `project.template: "orval"`
- `project.template: "kubb"`

## 2. External Templates

Use an external template when your team owns a different generator, output model, or package-assembly process.

Good fit:

- You need generator-specific behaviour that does not belong in GenX API core.
- You want capability manifests, validation, dry-run planning, dependency planning, and manifest/report participation.
- You want a reusable template contract rather than one-off local overrides.

Example:

```json
{
  "project": {
    "template": {
      "provider": "external",
      "module": "@acme/genxapi-template",
      "export": "genxTemplate"
    }
  }
}
```

Use this path when the customization is a real template, not just a scaffold tweak.

## 3. Escape Hatches

Use escape hatches when you still want a built-in template and only need local customization inside that template boundary.

Good fit:

- You want to swap scaffold files.
- You want template-local placeholder replacement.
- You need generator-native pass-through that the selected template already treats as an escape hatch.

Examples:

- `project.templateOptions.path`
- `project.templateOptions.variables`
- Kubb plugin pass-through via `project.config.plugins` / `clients[].config.plugins`

These options do not create a new template interface. They customize the selected template.

## Decision Rules

- If Orval or Kubb already owns the generator behaviour, stay with the built-in template.
- If your team needs a reusable generator adapter with its own validation and capability manifest, create an external template.
- If you only need to tweak files, variables, or plugin pass-through inside an existing template, use escape hatches.

## What Not To Do

- Do not push generator-specific behaviour into GenX API core just to avoid maintaining a template.
- Do not use `project.templateOptions.path` as a hidden plugin system.
- Do not couple a custom template to consumer repo layout or backend source layout.
- Do not bypass capability manifests or validation for the sake of dynamic loading convenience.

## Migration Guidance

When a custom setup outgrows escape hatches:

1. Keep the generated package boundary the same.
2. Move generator-specific logic into a separate template package or local template module.
3. Add a capability manifest that documents what the template owns.
4. Implement `planGeneration` so dry runs and generated docs stay accurate.
5. Switch `project.template` to the explicit external reference form.
