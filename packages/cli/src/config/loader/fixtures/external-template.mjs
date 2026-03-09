import { z } from "zod";

const TemplateConfigSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    directory: z.string().min(1),
    packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm"),
    runGenerate: z.boolean().default(true),
    template: z.object({
      name: z.string().min(1),
      installDependencies: z.boolean().default(true),
      path: z.string().optional(),
      variables: z.record(z.string(), z.string()).default({})
    }),
    repository: z.record(z.string(), z.unknown()).optional(),
    publish: z.record(z.string(), z.unknown()).optional(),
    readme: z.record(z.string(), z.unknown()).optional()
  }),
  clients: z.array(
    z.object({
      name: z.string().min(1),
      swagger: z.string().optional(),
      contract: z.record(z.string(), z.unknown()).optional(),
      output: z
        .object({
          workspace: z.string().optional(),
          target: z.string().optional(),
          schemas: z.string().optional()
        })
        .optional(),
      acme: z
        .object({
          runtime: z.enum(["fetch", "axios"]).default("fetch")
        })
        .default({})
    })
  ),
  hooks: z
    .object({
      beforeGenerate: z.array(z.string()).default([]),
      afterGenerate: z.array(z.string()).default([])
    })
    .default({})
});

function createTemplateOptions(templateName, templateOptions) {
  return {
    name: templateName,
    installDependencies: templateOptions?.installDependencies ?? true,
    path: templateOptions?.path,
    variables: templateOptions?.variables ?? {}
  };
}

export const acmeTemplate = {
  id: "acme-http",
  name: "@acme/genxapi-template",
  displayName: "Acme HTTP Template",
  aliases: ["acme-http"],
  schema: TemplateConfigSchema,
  capabilityManifest: {
    summary:
      "Example external template that keeps contract and package orchestration in GenX API while owning its runtime adapter surface.",
    capabilities: [
      {
        key: "contracts",
        label: "Contract boundary",
        description: "Consumes GenX API contract inputs without bypassing core contract resolution.",
        classification: "universal",
        configPaths: ["clients[].swagger", "clients[].contract"]
      },
      {
        key: "acme-runtime",
        label: "Acme runtime adapter",
        description: "Maps GenX API HTTP-client intent into the external template runtime surface.",
        classification: "template-first-class",
        configPaths: ["project.config.httpClient", "clients[].config.httpClient"]
      },
      {
        key: "template-variables",
        label: "Template variables",
        description: "Injects external-template-local placeholder values into scaffold files.",
        classification: "escape-hatch",
        configPaths: ["project.templateOptions.variables"]
      }
    ]
  },
  transformUnifiedConfig(unified, context) {
    return {
      project: {
        name: unified.project.name,
        directory: unified.project.directory,
        packageManager: unified.project.packageManager,
        runGenerate: unified.project.runGenerate ?? true,
        template: createTemplateOptions(context.templateName, unified.project.templateOptions),
        repository: unified.project.repository,
        publish: unified.project.publish,
        readme: unified.project.readme
      },
      clients: unified.clients.map((client) => ({
        name: client.name,
        swagger: client.contract?.source ?? client.swagger,
        contract: client.contract,
        output: client.output,
        acme: {
          runtime:
            client.config?.httpClient === "axios" || unified.project.config?.httpClient === "axios"
              ? "axios"
              : "fetch"
        }
      })),
      hooks: unified.hooks ?? {
        beforeGenerate: [],
        afterGenerate: []
      }
    };
  },
  validateConfig(config) {
    TemplateConfigSchema.parse(config);
  },
  planGeneration(config) {
    return {
      selectedCapabilities: [
        "contracts",
        "acme-runtime",
        ...(Object.keys(config.project.template.variables ?? {}).length > 0
          ? ["template-variables"]
          : [])
      ],
      dependencies: [
        {
          name: "@acme/runtime",
          section: "peerDependencies",
          reason: "Consumers install the runtime adapter selected by the external template."
        }
      ],
      documentationHints: [
        {
          title: "External template contract",
          body: "This template participates in GenX API planning and manifest reporting through the same stable template contract as built-in templates."
        }
      ],
      output: {
        configFiles: ["acme.template.json"],
        entrypoints: ["src/index.ts"],
        notes: ["The package boundary remains the generated package entrypoint, not template internals."]
      }
    };
  },
  async generateClients() {}
};
