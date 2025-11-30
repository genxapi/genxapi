import { describe, expect, it } from "vitest";
import { buildKubbConfig } from "./buildKubbConfig";

const unifiedBase = {
  project: {
    name: "demo",
    directory: "./demo",
    packageManager: "npm" as const,
    template: "kubb",
    templateOptions: {},
    config: {
      baseUrl: "https://api.example.com",
      httpClient: "fetch",
      plugins: {
        client: { foo: "bar" },
        ts: { a: 1 },
        oas: { b: 2 }
      }
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
        kubb: {
          client: { baz: true }
        }
      }
    }
  ],
  hooks: { beforeGenerate: [], afterGenerate: [] }
};

describe("buildKubbConfig", () => {
  it("maps unified config into kubb-specific config", () => {
    const result = buildKubbConfig(unifiedBase as any, "@genxapi/template-kubb");
    expect(result.project.template?.name).toBe("@genxapi/template-kubb");
    const client = result.clients[0] as any;
    expect(client.output.workspace).toBe("./clients/pets");
    expect(client.kubb.client.client).toBe("fetch");
    expect(client.kubb.client.baseURL).toBe("https://api.example.com");
    expect(client.kubb.client.baz).toBe(true);
    expect(client.kubb.ts).toEqual({ a: 1 });
    expect(client.kubb.oas).toEqual({ b: 2 });
  });
});
