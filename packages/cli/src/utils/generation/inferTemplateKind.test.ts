import { describe, expect, it } from "vitest";
import { TEMPLATE_PACKAGE_MAP } from "src/utils/templatePackages";
import { ClientApiTemplates } from "src/types";
import { inferTemplateKind } from "./inferTemplateKind";

describe("inferTemplateKind", () => {
  it("returns matching enum for known template packages", () => {
    expect(inferTemplateKind(TEMPLATE_PACKAGE_MAP.orval)).toBe(ClientApiTemplates.Orval);
    expect(inferTemplateKind(TEMPLATE_PACKAGE_MAP.kubb)).toBe(ClientApiTemplates.Kubb);
  });

  it("returns undefined for unknown template packages", () => {
    expect(inferTemplateKind("@acme/custom")).toBeUndefined();
  });
});
