import { describe, expect, it } from "vitest";
import { TEMPLATE_PACKAGE_MAP } from "../../../utils/templatePackages";
import { inferTemplateFromConfig, resolveTemplateAlias } from "./templateResolution";

describe("templateResolution", () => {
  it("resolves explicit template alias", () => {
    expect(resolveTemplateAlias("orval")).toBe(TEMPLATE_PACKAGE_MAP.orval);
    expect(resolveTemplateAlias("@genxapi/template-kubb")).toBe(TEMPLATE_PACKAGE_MAP.kubb);
  });

  it("infers template from config with string template", () => {
    const config = { project: { template: "kubb" } };
    expect(inferTemplateFromConfig(config)).toBe(TEMPLATE_PACKAGE_MAP.kubb);
  });

  it("infers template from explicit built-in or external template references", () => {
    expect(
      inferTemplateFromConfig({
        project: {
          template: {
            provider: "builtin",
            name: "orval"
          }
        }
      })
    ).toEqual({
      provider: "builtin",
      name: TEMPLATE_PACKAGE_MAP.orval
    });

    expect(
      inferTemplateFromConfig({
        project: {
          template: {
            provider: "external",
            module: "./templates/acme-template.mjs"
          }
        }
      })
    ).toEqual({
      provider: "external",
      module: "./templates/acme-template.mjs",
      export: "genxTemplate"
    });
  });

  it("falls back to default when template is missing or invalid", () => {
    expect(inferTemplateFromConfig(null)).toBe(TEMPLATE_PACKAGE_MAP.orval);
    expect(inferTemplateFromConfig({})).toBe(TEMPLATE_PACKAGE_MAP.orval);
    expect(inferTemplateFromConfig({ project: {} })).toBe(TEMPLATE_PACKAGE_MAP.orval);
  });
});
