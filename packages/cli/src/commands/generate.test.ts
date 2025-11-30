import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { runGenerateCommand } from "./generate";
import type { CliConfig, TemplateModule } from "../config/loader";
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
    const logger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      setLevel: vi.fn()
    } as any;

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
});
