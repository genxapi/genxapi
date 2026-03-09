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

    expect(result.project.template.name).toBe("@genxapi/template-kubb");
    expect(result.clients[0].copySwagger).toBe(true);
    expect(result.project.publish?.npm?.enabled).toBe(false);
    expect(result.clients[0].kubb.client.client).toBeUndefined();
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
            checksum: true
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
            httpClient: "fetch",
            plugins: {
              ts: {
                enumType: "asConst"
              }
            }
          }
        },
        clients: [
          {
            name: "pets",
            contract: {
              source: "https://api.example.com/openapi.json",
              auth: {
                type: "bearer",
                tokenEnv: "OPENAPI_TOKEN"
              }
            },
            config: {
              httpClient: "axios",
              plugins: {
                client: {
                  dataReturnType: "full"
                }
              }
            }
          }
        ]
      } as any,
      { templateName: "@genxapi/template-kubb" }
    );

    expect(result.project.template.name).toBe("@genxapi/template-kubb");
    expect(result.clients[0].swagger).toBe("https://api.example.com/openapi.json");
    expect(result.clients[0].kubb.client.client).toBe("axios");
    expect(result.clients[0].kubb.client.dataReturnType).toBe("full");
    expect(result.clients[0].kubb.ts.enumType).toBe("asConst");
    expect(result.clients[0].output.workspace).toBe("clients/pets");
  });

  it("plans Kubb dependencies from selected features", () => {
    const config = MultiClientConfigSchema.parse({
      project: {
        name: "demo",
        directory: "./demo",
        packageManager: "npm",
        template: {
          name: "@genxapi/template-kubb",
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
          kubb: {
            client: {
              client: "axios",
              parser: "zod"
            }
          }
        }
      ]
    });

    const plan = genxTemplate.planGeneration!(config);
    const dependencyNames = plan.dependencies.map((dependency) => dependency.name);

    expect(plan.selectedCapabilities).toContain("kubb-plugin-client");
    expect(dependencyNames).toContain("axios");
    expect(dependencyNames).toContain("zod");
  });

  it("rejects Orval-only unified options", () => {
    expect(() =>
      genxTemplate.transformUnifiedConfig!(
        {
          project: {
            name: "demo",
            directory: "./demo",
            packageManager: "npm",
            config: {
              mock: {
                type: "msw"
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
        { templateName: "@genxapi/template-kubb" }
      )
    ).toThrow(/Orval-specific configuration/);
  });
});
