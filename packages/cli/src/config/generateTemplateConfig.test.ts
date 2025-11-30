import { describe, expect, it } from "vitest";
import { ClientApiTemplates } from "src/types";
import { generateTemplateConfig } from "./generateTemplateConfig";

describe("generateTemplateConfig", () => {
  it("returns orval template config and identifier", () => {
    const unified = {
      project: {
        name: "demo",
        directory: "./demo",
        packageManager: "npm",
        template: "orval",
        templateOptions: {},
        config: {}
      },
      clients: [
        {
          name: "pets",
          swagger: "./pet.yaml"
        }
      ],
      hooks: { beforeGenerate: [], afterGenerate: [] }
    };

    const result = generateTemplateConfig(unified as any, "@genxapi/template-orval");
    expect(result.template).toBe(ClientApiTemplates.Orval);
    expect(result.config.project.name).toBe("demo");
  });

  it("returns kubb template config and identifier", () => {
    const unified = {
      project: {
        name: "demo",
        directory: "./demo",
        packageManager: "npm",
        template: "kubb",
        templateOptions: {},
        config: {}
      },
      clients: [
        {
          name: "pets",
          swagger: "./pet.yaml"
        }
      ],
      hooks: { beforeGenerate: [], afterGenerate: [] }
    };

    const result = generateTemplateConfig(unified as any, "@genxapi/template-kubb");
    expect(result.template).toBe(ClientApiTemplates.Kubb);
    expect(result.config.project.template?.name).toBe("@genxapi/template-kubb");
  });
});
