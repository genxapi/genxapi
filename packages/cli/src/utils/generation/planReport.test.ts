import { describe, expect, it } from "vitest";
import { buildGenerationPlanReport, renderGenerationPlanReport } from "./planReport";

describe("planReport", () => {
  it("builds a CI-friendly plan report with sanitized contract sources", () => {
    const report = buildGenerationPlanReport({
      config: {
        logLevel: "info",
        project: {
          name: "pets-sdk",
          directory: "./sdk/pets",
          packageManager: "npm",
          runGenerate: true,
          template: "@genxapi/template-orval",
          publish: {
            npm: {
              enabled: true,
              dryRun: true,
            },
          },
        },
        clients: [
          {
            name: "pets",
          },
        ],
        hooks: {
          beforeGenerate: [],
          afterGenerate: [],
        },
      },
      projectDir: "/tmp/sdk/pets",
      template: {
        id: "orval",
        name: "@genxapi/template-orval",
        displayName: "Orval API Client Template",
        aliases: ["orval"],
        schema: {} as any,
        capabilityManifest: {
          summary: "Orval summary",
          capabilities: [],
        },
        generateClients: async () => {},
      },
      templateKind: "orval",
      templatePlan: {
        selectedCapabilities: ["contracts", "orval-client"],
        dependencies: [
          {
            name: "orval",
            section: "devDependencies",
            reason: "Required to generate the package.",
          },
        ],
      },
      clients: [
        {
          name: "pets",
          output: {
            workspace: "./src/pets",
            target: "./src/pets/client.ts",
            schemas: "./src/pets/model",
          },
        },
      ],
      resolvedContracts: {
        pets: {
          source: "https://user:secret@api.example.com/openapi.json",
          type: "remote",
          resolvedSource: "https://user:secret@api.example.com/openapi.json",
          generatorInput: ".genxapi/contracts/pets.json",
          snapshot: {
            enabled: true,
            path: ".genxapi/contracts/pets.json",
          },
          metadata: {
            sizeBytes: 128,
          },
          info: {
            source: "https://api.example.com/openapi.json",
            title: "Pets API",
            version: "1.0.0",
          },
        },
      },
      generatedAt: "2026-03-09T10:00:00.000Z",
      dryRun: true,
      toolVersion: "0.2.0",
      contractVersion: "v2026.03.09",
    });

    expect(report.clients[0].contract.source).toBe("https://api.example.com/openapi.json");
    expect(report.plannedActions.find((action) => action.id === "publish-npm")).toMatchObject({
      enabled: true,
    });

    const rendered = renderGenerationPlanReport(report);
    expect(rendered).toContain("GenX API generation plan");
    expect(rendered).toContain("contract source: https://api.example.com/openapi.json");
    expect(rendered).toContain("run Publish to npm registry");
    expect(rendered).toContain("Next steps:");
    expect(report.nextSteps[0].id).toBe("run-generate-from-plan");
  });
});
