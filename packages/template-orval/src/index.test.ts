import { describe, expect, it } from "vitest";
import { genxTemplate } from "./genxTemplate.js";
import { MultiClientConfigSchema } from "./types.js";

describe("MultiClientConfigSchema", () => {
  it("parses minimal configuration", () => {
    const result = MultiClientConfigSchema.parse({
      project: {
        name: "demo",
        directory: "./demo",
        packageManager: "npm"
      },
      clients: [
        {
          name: "pets",
          swagger: "./petstore.yaml",
          output: {
            workspace: "./src/pets",
            target: "./src/pets/client.ts",
            schemas: "model"
          }
        }
    ]
    });
    expect(result.project.name).toBe("demo");
    expect(result.clients[0].orval.mode).toBe("split");
    expect(result.project.publish?.npm?.enabled).toBe(false);
    expect(result.project.repository).toBeUndefined();
  });

  it("accepts contract.source in place of the legacy swagger field", () => {
    const result = MultiClientConfigSchema.parse({
      project: {
        name: "demo",
        directory: "./demo",
        packageManager: "npm"
      },
      clients: [
        {
          name: "pets",
          contract: {
            source: "https://api.example.com/openapi.json",
            snapshot: {
              path: ".genxapi/contracts/pets.json"
            }
          },
          output: {
            workspace: "./src/pets",
            target: "./src/pets/client.ts",
            schemas: "model"
          }
        }
      ]
    });

    expect(result.clients[0].contract?.source).toBe("https://api.example.com/openapi.json");
    expect(result.clients[0].swagger).toBeUndefined();
  });

  it("transforms unified config through the template contract", () => {
    const result = genxTemplate.transformUnifiedConfig!(
      {
        project: {
          name: "demo",
          directory: "./demo",
          packageManager: "npm",
          templateOptions: {},
          output: "./clients",
          config: {
            baseUrl: "https://api.example.com",
            client: "fetch",
            mock: { type: "off" }
          }
        },
        clients: [
          {
            name: "pets",
            contract: {
              source: "https://api.example.com/openapi.json",
              checksum: true
            }
          }
        ]
      } as any,
      { templateName: "@genxapi/template-orval" }
    );

    expect(result.project.template.name).toBe("@genxapi/template-orval");
    expect(result.clients[0].swagger).toBe("https://api.example.com/openapi.json");
    expect(result.clients[0].orval.client).toBe("fetch");
    expect(result.clients[0].orval.mock).toBe(false);
    expect(result.clients[0].output.workspace).toBe("clients/pets");
  });

  it("plans Orval dependencies from selected features", () => {
    const config = MultiClientConfigSchema.parse({
      project: {
        name: "demo",
        directory: "./demo",
        packageManager: "npm",
        template: {
          name: "@genxapi/template-orval",
          installDependencies: false,
          variables: {}
        }
      },
      clients: [
        {
          name: "pets",
          swagger: "./petstore.yaml",
          output: {
            workspace: "./src/pets",
            target: "./src/pets/client.ts",
            schemas: "model"
          },
          orval: {
            client: "fetch",
            mock: false
          }
        }
      ]
    });

    const plan = genxTemplate.planGeneration!(config);
    const dependencyNames = plan.dependencies.map((dependency) => dependency.name);

    expect(plan.selectedCapabilities).toContain("orval-client");
    expect(dependencyNames).not.toContain("@tanstack/react-query");
    expect(dependencyNames).not.toContain("react");
    expect(dependencyNames).not.toContain("msw");
    expect(dependencyNames).not.toContain("@faker-js/faker");
  });

  it("rejects Kubb-only unified options", () => {
    expect(() =>
      genxTemplate.transformUnifiedConfig!(
        {
          project: {
            name: "demo",
            directory: "./demo",
            packageManager: "npm",
            config: {
              plugins: {
                client: {
                  dataReturnType: "data"
                }
              }
            }
          },
          clients: [
            {
              name: "pets",
              swagger: "./petstore.yaml"
            }
          ]
        } as any,
        { templateName: "@genxapi/template-orval" }
      )
    ).toThrow(/Kubb-specific configuration/);
  });
});
