import { describe, expect, it } from "vitest";
import { ClientApiTemplates, type TemplateOverrides } from "src/types";
import { applyTemplateOverrides } from "./applyTemplateOverrides";

const baseProject = {
  name: "demo",
  directory: "./demo",
  packageManager: "npm" as const,
  runGenerate: true,
  template: ClientApiTemplates.Orval
};

describe("applyTemplateOverrides", () => {
  it("applies project-level overrides without mutating the input", () => {
    const config = {
      logLevel: "info",
      project: { ...baseProject },
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

    const overrides: TemplateOverrides = {
      packageManager: "pnpm",
      publish: {
        npm: {
          enabled: true,
          tag: "next",
          access: "restricted",
          registry: "https://registry.npmjs.org/"
        }
      }
    };

    const result = applyTemplateOverrides(config as any, ClientApiTemplates.Orval, overrides);

    expect(result.project.packageManager).toBe("pnpm");
    expect((result.project.publish as any).npm.enabled).toBe(true);
    expect((result.project.publish as any).npm.tag).toBe("next");
    expect(config.project.packageManager).toBe("npm"); // original untouched
  });

  it("applies orval client overrides", () => {
    const config = {
      logLevel: "info",
      project: { ...baseProject },
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

    const overrides: TemplateOverrides = {
      mode: "split",
      client: "axios",
      httpClient: "fetch",
      baseUrl: "https://api.example.com",
      prettier: false,
      clean: true,
      mock: {
        type: "msw",
        delay: 50,
        useExamples: true,
        enabled: true
      }
    };

    const result = applyTemplateOverrides(config as any, ClientApiTemplates.Orval, overrides);
    const client = (result.clients[0] as any).orval;

    expect(client.mode).toBe("split");
    expect(client.client).toBe("axios");
    expect(client.httpClient).toBe("fetch");
    expect(client.baseUrl).toBe("https://api.example.com");
    expect(client.prettier).toBe(false);
    expect(client.clean).toBe(true);
    expect(client.mock).toEqual({
      type: "msw",
      delay: 50,
      useExamples: true
    });
  });

  it("applies kubb client overrides", () => {
    const config = {
      logLevel: "info",
      project: {
        ...baseProject,
        template: ClientApiTemplates.Kubb
      },
      clients: [
        {
          name: "pets",
          swagger: "./pet.yaml",
          output: {},
          kubb: {
            client: {}
          }
        }
      ],
      hooks: { beforeGenerate: [], afterGenerate: [] }
    };

    const overrides: TemplateOverrides = {
      httpClient: "axios",
      baseUrl: "https://api.example.com"
    };

    const result = applyTemplateOverrides(config as any, ClientApiTemplates.Kubb, overrides);
    const client = (result.clients[0] as any).kubb;

    expect(client.client.client).toBe("axios");
    expect(client.client.baseURL).toBe("https://api.example.com");
  });
});
