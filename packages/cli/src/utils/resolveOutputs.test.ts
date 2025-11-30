import { describe, expect, it } from "vitest";
import { resolveOutputs } from "./resolveOutputs";

describe("resolveOutputs", () => {
  it("uses project output when provided", () => {
    const result = resolveOutputs("./base", {}, "pets");
    expect(result.workspace).toContain("base/pets");
    expect(result.target).toContain("base/pets/client.ts");
    expect(result.schemas).toContain("base/pets/model");
  });

  it("falls back to default src path when project output missing", () => {
    const result = resolveOutputs(undefined, {}, "pets");
    expect(result.workspace).toBe("src/pets");
  });

  it("allows client overrides", () => {
    const result = resolveOutputs("./base", { workspace: "./custom" }, "pets");
    expect(result.workspace).toBe("./custom");
  });
});
