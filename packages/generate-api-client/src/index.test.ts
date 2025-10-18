import { describe, expect, it } from "vitest";
import { CliConfigSchema } from "./config/schema.js";

describe("CliConfigSchema", () => {
  it("parses minimal configuration", () => {
    const config = CliConfigSchema.parse({
      project: {
        name: "demo",
        directory: "./demo"
      },
      clients: [
        {
          name: "pets",
          swagger: "./specs/pet.yaml",
          output: {
            workspace: "./src/pets",
            target: "./src/pets/client.ts",
            schemas: "model"
          }
        }
      ]
    });
    expect(config.project.name).toBe("demo");
  });
});
