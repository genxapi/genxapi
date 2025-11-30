import { describe, expect, it } from "vitest";
import { ClientApiTemplates } from "src/types";
import { buildTemplateConfig } from "./buildTemplateConfig";

describe("buildTemplateConfig", () => {
  it("hydrates template object from templateOptions", () => {
    const config = {
      logLevel: "info",
      project: {
        name: "demo",
        directory: "./demo",
        packageManager: "npm" as const,
        runGenerate: true,
        template: ClientApiTemplates.Orval,
        templateOptions: {
          path: "./custom",
          installDependencies: false,
          variables: { foo: "bar" }
        }
      },
      clients: [],
      hooks: { beforeGenerate: [], afterGenerate: [] }
    };

    const result = buildTemplateConfig(config as any, "@genxapi/template-orval");

    expect(result.project.template).toEqual({
      name: "@genxapi/template-orval",
      installDependencies: false,
      path: "./custom",
      variables: { foo: "bar" }
    });
    expect(config.project.template).toBe(ClientApiTemplates.Orval); // original unchanged
  });
});
