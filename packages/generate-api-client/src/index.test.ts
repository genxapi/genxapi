import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { describe, expect, it } from "vitest";
import { loadCliConfig } from "./config/loader.js";

describe("loadCliConfig", () => {
  it("parses minimal configuration using the default template", async () => {
    const dir = await mkdtemp(join(tmpdir(), "generate-api-client-"));
    const configPath = join(dir, "config.json");
    await writeFile(
      configPath,
      JSON.stringify(
        {
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
        },
        null,
        2
      ),
      "utf8"
    );

    const { config } = await loadCliConfig({ file: configPath });
    expect(config.project.name).toBe("demo");
    expect(config.project.publish?.npm?.enabled).toBe(false);
  });
});
