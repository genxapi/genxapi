import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCliConfig } from "./config/loader";
import { TEMPLATE_PACKAGE_MAP } from "./utils/templatePackages";

describe("loadCliConfig", () => {
  it("parses minimal configuration using the default template", async () => {
    const dir = await mkdtemp(join(tmpdir(), "genxapi-"));
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

    const { config, template } = await loadCliConfig({ file: configPath });
    expect(config.project.name).toBe("demo");
    expect(config.project.publish?.npm?.enabled).toBe(false);
    expect(config.project.template).toBe(TEMPLATE_PACKAGE_MAP.orval);
    expect(template.id).toBe("orval");
    expect(template.capabilityManifest.capabilities.length).toBeGreaterThan(0);
  });

  it("overrides template when provided via CLI option", async () => {
    const dir = await mkdtemp(join(tmpdir(), "genxapi-"));
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

    const { config } = await loadCliConfig({ file: configPath, template: "kubb" });
    expect(config.project.template).toBe(TEMPLATE_PACKAGE_MAP.kubb);
  });

  it("loads a TypeScript config file when passed explicitly", async () => {
    const dir = await mkdtemp(join(tmpdir(), "genxapi-"));
    const configPath = join(dir, "genxapi.config.ts");
    await writeFile(
      configPath,
      `const config = {
  project: {
    name: "demo-ts",
    directory: "./demo"
  },
  clients: [
    {
      name: "pets",
      swagger: "./specs/pet.yaml"
    }
  ]
};

export default config;
`,
      "utf8"
    );

    const { config } = await loadCliConfig({ file: configPath });
    expect(config.project.name).toBe("demo-ts");
    expect(config.project.template).toBe(TEMPLATE_PACKAGE_MAP.orval);
  });

  it("discovers a TypeScript config file from cwd", async () => {
    const dir = await mkdtemp(join(tmpdir(), "genxapi-"));
    const configPath = join(dir, "genxapi.config.ts");
    await writeFile(
      configPath,
      `const config = {
  project: {
    name: "demo-search-ts",
    directory: "./demo"
  },
  clients: [
    {
      name: "pets",
      swagger: "./specs/pet.yaml"
    }
  ]
};

export default config;
`,
      "utf8"
    );

    const { config } = await loadCliConfig({ cwd: dir });
    expect(config.project.name).toBe("demo-search-ts");
    expect(config.project.template).toBe(TEMPLATE_PACKAGE_MAP.orval);
  });

  it("accepts contract.source in place of the legacy swagger string", async () => {
    const dir = await mkdtemp(join(tmpdir(), "genxapi-"));
    const configPath = join(dir, "config.json");
    await writeFile(
      configPath,
      JSON.stringify(
        {
          project: {
            name: "demo-contract",
            directory: "./demo"
          },
          clients: [
            {
              name: "pets",
              contract: {
                source: "https://api.example.com/openapi.json",
                auth: {
                  type: "bearer",
                  tokenEnv: "OPENAPI_TOKEN"
                },
                snapshot: {
                  path: ".genxapi/contracts/pets.json"
                }
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
    expect((config.clients[0] as any).swagger).toBe("https://api.example.com/openapi.json");
    expect((config.clients[0] as any).contract).toMatchObject({
      source: "https://api.example.com/openapi.json",
      auth: {
        type: "bearer",
        tokenEnv: "OPENAPI_TOKEN"
      }
    });
  });
});
