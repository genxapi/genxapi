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
  });
});
