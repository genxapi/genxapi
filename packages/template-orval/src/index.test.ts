import { describe, expect, it } from "vitest";
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
});
