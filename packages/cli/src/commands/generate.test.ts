import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { runGenerateCommand } from "./generate";
import { loadCliConfig, type CliConfig, type TemplateModule } from "../config/loader";
import type { Logger } from "../utils/logger";

vi.mock("src/utils/generation/runPostGenerationTasks", () => ({
  runPostGenerationTasks: vi.fn().mockResolvedValue(undefined)
}));

describe("runGenerateCommand", () => {
  it("applies overrides and invokes template generateClients with hydrated template config", async () => {
    const generateClients = vi.fn().mockResolvedValue(undefined);
    const template: TemplateModule = {
      name: "@genxapi/template-orval",
      schema: z.object({
        project: z.any(),
        clients: z.array(z.any()),
        hooks: z.any()
      }),
      generateClients
    };
    const logger = createLogger();

    const config: CliConfig = {
      logLevel: "info",
      project: {
        name: "demo",
        directory: "./demo",
        packageManager: "npm",
        runGenerate: true,
        template: "@genxapi/template-orval",
        templateOptions: { installDependencies: true },
        publish: {}
      },
      clients: [
        {
          name: "pets",
          swagger: "./pet.yaml",
          output: {},
          orval: {}
        }
      ],
      hooks: { beforeGenerate: [], afterGenerate: [] }
    };

    await runGenerateCommand({
      config,
      configDir: process.cwd(),
      logger,
      template,
      overrides: {
        baseUrl: "https://api.example.com",
        httpClient: "fetch"
      }
    });

    expect(generateClients).toHaveBeenCalledTimes(1);
    const [generatedConfig] = generateClients.mock.calls[0];
    expect(generatedConfig.project.template).toMatchObject({
      name: "@genxapi/template-orval"
    });
    expect(generatedConfig.clients[0].orval.httpClient).toBe("fetch");
  });

  it("passes the kubb sample config through to generate both pets and store clients", async () => {
    const samplePath = fileURLToPath(
      new URL("../../../../samples/kubb-multi-client.config.json", import.meta.url)
    );
    const { config, configDir, template } = await loadCliConfig({ file: samplePath });
    const generateClients = vi.fn().mockResolvedValue(undefined);

    await runGenerateCommand({
      config,
      configDir,
      logger: createLogger(),
      template: { ...template, generateClients }
    });

    expect(generateClients).toHaveBeenCalledTimes(1);
    const [generatedConfig] = generateClients.mock.calls[0] as [any];
    expect(generatedConfig.project.template.name).toBe("@genxapi/template-kubb");

    const pets = generatedConfig.clients.find((client: any) => client.name === "pets");
    const store = generatedConfig.clients.find((client: any) => client.name === "store");

    expect(pets).toBeDefined();
    expect(store).toBeDefined();
    expect(pets.output.workspace).toBe("src/pets");
    expect(pets.kubb.client.client).toBe("fetch");
    expect(pets.kubb.client.baseURL).toBe("https://api.pets.local");
    expect(pets.kubb.client.dataReturnType).toBe("data");
    expect(pets.kubb.ts.enumType).toBe("asConst");

    expect(store.output.workspace).toBe("src/store");
    expect(store.kubb.client.client).toBe("axios");
    expect(store.kubb.client.baseURL).toBe("https://api.store.local");
    expect(store.kubb.client.dataReturnType).toBe("full");
    expect(store.kubb.ts.enumType).toBe("enum");
  });

  it("passes the orval sample config through to generate both pets and store clients", async () => {
    const samplePath = fileURLToPath(
      new URL("../../../../samples/orval-multi-client.config.json", import.meta.url)
    );
    const { config, configDir, template } = await loadCliConfig({ file: samplePath });
    const generateClients = vi.fn().mockResolvedValue(undefined);

    await runGenerateCommand({
      config,
      configDir,
      logger: createLogger(),
      template: { ...template, generateClients }
    });

    expect(generateClients).toHaveBeenCalledTimes(1);
    const [generatedConfig] = generateClients.mock.calls[0] as [any];
    expect(generatedConfig.project.template.name).toBe("@genxapi/template-orval");

    const pets = generatedConfig.clients.find((client: any) => client.name === "pets");
    const store = generatedConfig.clients.find((client: any) => client.name === "store");

    expect(pets).toBeDefined();
    expect(store).toBeDefined();
    expect(pets.output.target).toBe("src/pets/client.ts");
    expect(pets.orval.baseUrl).toBe("https://api.pets.local");
    expect(pets.orval.client).toBe("react-query");
    expect(pets.orval.mock).toEqual({ type: "msw", useExamples: true });

    expect(store.output.target).toBe("src/store/client.ts");
    expect(store.orval.httpClient).toBe("axios");
    expect(store.orval.baseUrl).toBe("https://api.store.local");
    expect(store.orval.client).toBe("axios");
    expect(store.orval.mock).toBe(false);
  });
});

function createLogger(): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setLevel: vi.fn()
  } as any;
}
