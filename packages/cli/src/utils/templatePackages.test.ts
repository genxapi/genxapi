import { describe, expect, it } from "vitest";
import { TEMPLATE_PACKAGE_MAP, resolveTemplatePackage } from "./templatePackages";

describe("templatePackages", () => {
  it("resolves known aliases to package names", () => {
    expect(resolveTemplatePackage("orval")).toBe(TEMPLATE_PACKAGE_MAP.orval);
    expect(resolveTemplatePackage("kubb")).toBe(TEMPLATE_PACKAGE_MAP.kubb);
    expect(resolveTemplatePackage("OrVaL")).toBe(TEMPLATE_PACKAGE_MAP.orval);
  });

  it("returns unknown selectors unchanged", () => {
    expect(resolveTemplatePackage("@acme/custom")).toBe("@acme/custom");
  });
});
