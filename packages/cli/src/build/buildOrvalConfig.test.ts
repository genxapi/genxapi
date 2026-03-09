import { describe, expect, it } from "vitest";
import { buildOrvalConfig } from "./buildOrvalConfig";

const unifiedBase = {
  project: {
    name: "demo",
    directory: "./demo",
    packageManager: "npm" as const,
    template: "orval",
    templateOptions: {},
    config: {
      baseUrl: "https://api.example.com",
      mock: true,
      prettier: true
    }
  },
  clients: [
    {
      name: "pets",
      swagger: "./pet.yaml",
      output: {
        workspace: "./clients/pets"
      },
      config: {
        mode: "split",
        client: "axios-functions",
        mock: {
          type: "msw",
          delay: 50
        }
      }
    }
  ],
  hooks: { beforeGenerate: [], afterGenerate: [] }
};

describe("buildOrvalConfig", () => {
  it("maps unified config into orval-specific config", () => {
    const result = buildOrvalConfig(unifiedBase as any, "@genxapi/template-orval");
    expect(result.project.name).toBe("demo");
    expect(result.project.template?.name).toBe("@genxapi/template-orval");
    const client = result.clients[0] as any;
    expect(client.output.workspace).toBe("./clients/pets");
    expect(client.swagger).toBe("./pet.yaml");
    expect(client.orval.mode).toBe("split");
    expect(client.orval.client).toBe("axios-functions");
    expect(client.orval.baseUrl).toBe("https://api.example.com");
    expect(client.orval.mock).toEqual({
      type: "msw",
      delay: 50
    });
  });

  it("uses contract.source when the unified config declares the first-class contract block", () => {
    const result = buildOrvalConfig(
      {
        ...unifiedBase,
        clients: [
          {
            name: "pets",
            contract: {
              source: "https://api.example.com/openapi.json",
              checksum: true,
              snapshot: {
                path: ".genxapi/contracts/pets.json"
              }
            },
            output: {
              workspace: "./clients/pets"
            },
            config: {
              mode: "split"
            }
          }
        ]
      } as any,
      "@genxapi/template-orval"
    );

    const client = result.clients[0] as any;
    expect(client.swagger).toBe("https://api.example.com/openapi.json");
    expect(client.contract).toMatchObject({
      source: "https://api.example.com/openapi.json",
      checksum: true
    });
  });
});
