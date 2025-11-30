import { describe, expect, it } from "vitest";
import { createTemplateOptions } from "./creteTemplateOptions";

describe("createTemplateOptions", () => {
  it("builds template options with defaults", () => {
    const result = createTemplateOptions("@genxapi/template-orval", {});
    expect(result).toEqual({
      name: "@genxapi/template-orval",
      installDependencies: true,
      variables: {}
    });
  });

  it("respects provided options", () => {
    const result = createTemplateOptions("@genxapi/template-orval", {
      installDependencies: false,
      path: "./custom",
      variables: { foo: "bar" }
    });
    expect(result.installDependencies).toBe(false);
    expect(result.path).toBe("./custom");
    expect(result.variables).toEqual({ foo: "bar" });
  });
});
