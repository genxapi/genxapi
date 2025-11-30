import { describe, expect, it } from "vitest";
import { extractTemplateOptions } from "./templateOptions";

describe("extractTemplateOptions", () => {
  it("returns empty object for non-object input", () => {
    expect(extractTemplateOptions(undefined)).toEqual({});
    expect(extractTemplateOptions(null)).toEqual({});
    expect(extractTemplateOptions("orval")).toEqual({});
  });

  it("extracts path, installDependencies, and variables when provided", () => {
    const tpl = {
      path: "./templates/custom",
      installDependencies: false,
      variables: {
        foo: "bar"
      }
    };
    expect(extractTemplateOptions(tpl)).toEqual({
      path: "./templates/custom",
      installDependencies: false,
      variables: {
        foo: "bar"
      }
    });
  });

  it("ignores non-object variables", () => {
    const tpl = {
      variables: "nope"
    };
    expect(extractTemplateOptions(tpl).variables).toBeUndefined();
  });
});
