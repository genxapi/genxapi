---
title: "External Template Authoring"
---

# External Template Authoring

Use an external template when your team needs a generator or package-assembly flow that does not belong inside the GenX API core or inside the first-party Orval/Kubb templates.

## What To Export

An external template should export a stable template contract, usually named `genxTemplate`:

```ts
import { z } from "zod";
import type { GenxTemplate } from "@genxapi/cli";

type ExampleConfig = {
  project: {
    name: string;
    directory: string;
    template: {
      name: string;
      installDependencies: boolean;
      path?: string;
      variables: Record<string, string>;
    };
  };
  clients: Array<{
    name: string;
    swagger?: string;
  }>;
};

const ExampleConfigSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    directory: z.string().min(1),
    template: z.object({
      name: z.string().min(1),
      installDependencies: z.boolean(),
      path: z.string().optional(),
      variables: z.record(z.string(), z.string())
    })
  }),
  clients: z.array(
    z.object({
      name: z.string().min(1),
      swagger: z.string().optional()
    })
  )
});

export const genxTemplate: GenxTemplate<ExampleConfig> = {
  id: "example",
  name: "@acme/genxapi-template-example",
  displayName: "Acme Example Template",
  aliases: ["example"],
  schema: ExampleConfigSchema,
  capabilityManifest: {
    summary: "Example external template.",
    capabilities: [
      {
        key: "contracts",
        label: "Contract boundary",
        description: "Consumes contract inputs from GenX API core.",
        classification: "universal",
        configPaths: ["clients[].swagger", "clients[].contract"]
      }
    ]
  },
  transformUnifiedConfig(unified, context) {
    return {
      project: {
        name: unified.project.name,
        directory: unified.project.directory,
        template: {
          name: context.templateName,
          installDependencies: unified.project.templateOptions?.installDependencies ?? true,
          path: unified.project.templateOptions?.path,
          variables: unified.project.templateOptions?.variables ?? {}
        }
      },
      clients: unified.clients.map((client) => ({
        name: client.name,
        swagger: client.contract?.source ?? client.swagger
      }))
    };
  },
  validateConfig(config) {
    ExampleConfigSchema.parse(config);
  },
  planGeneration() {
    return {
      selectedCapabilities: ["contracts"],
      dependencies: [],
      output: {
        entrypoints: ["src/index.ts"]
      }
    };
  },
  async generateClients(config, options) {
    void config;
    void options;
  }
};
```

Use a type-only import from `@genxapi/cli` so your template package does not take a runtime dependency on the CLI entrypoint.

## Contract Checklist

- Identity:
  Declare `id`, `name`, `displayName`, and `aliases`.
- Capability manifest:
  Every capability in `planGeneration.selectedCapabilities` must also exist in `capabilityManifest.capabilities`.
- Validation:
  Use `schema` for structural parsing and `validateConfig` for template-only checks.
- Unified config support:
  Implement `transformUnifiedConfig` if you want the shared GenX API config surface.
- Generation:
  `generateClients` owns generator execution, package scaffolding, and template-local workflow.
- Dependency planning:
  `planGeneration.dependencies` should describe the package dependencies implied by selected capabilities.
- Documentation and output hints:
  Use `documentationHints` and `output` when the plan should explain follow-up steps or emitted package boundaries.

## Capability Design Rules

- Mark a capability as `universal` only when GenX API core owns the intent and every template can map it legitimately.
- Mark a capability as `template-first-class` when it is specific to your template but intentionally supported and documented.
- Mark a capability as `escape-hatch` when the template owns the surface entirely and GenX API should not pretend it is generic.

Do not move generator-specific richness into core just to make the manifest look more uniform.

## Referencing an External Template

Use the explicit external reference form in unified config:

```json
{
  "project": {
    "template": {
      "provider": "external",
      "module": "@acme/genxapi-template-example",
      "export": "genxTemplate"
    }
  }
}
```

For local development:

```json
{
  "project": {
    "template": {
      "provider": "external",
      "module": "./tools/genxapi-template.mjs",
      "export": "genxTemplate"
    }
  }
}
```

Relative module paths resolve from the config file directory.

## Boundary Rules

- Keep backend coupling at the contract boundary. Do not inspect backend source code or repository conventions.
- Keep consumer coupling at the generated package boundary. Consumers should import the package, not template internals.
- Keep generator richness inside the template. GenX API core should only orchestrate lifecycle, metadata, and shared workflow.
- Use `project.templateOptions.path` only for scaffold overrides inside an existing template, not as a substitute for a real external template contract.

## Recommended Validation Strategy

- Parse with Zod in `schema`.
- Re-parse inside `validateConfig` if you need custom error messages or cross-field checks.
- Reject options that belong to another template family instead of silently ignoring them.
- Keep `planGeneration` deterministic so dry-run planning and generated documentation match real generation output.
