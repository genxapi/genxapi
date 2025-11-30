import { describe, expect, it } from "vitest";
import { normaliseMockValue } from "./normaliseMockValue";

describe("normaliseMockValue", () => {
  it("returns undefined when no options provided", () => {
    expect(normaliseMockValue(undefined, undefined)).toBeUndefined();
  });

  it("returns false when disabled and no detailed overrides", () => {
    expect(normaliseMockValue(false, {})).toBe(false);
  });

  it("merges options with overrides", () => {
    const base = { type: "msw" as const, delay: 10 };
    const overrides = { delay: 50, useExamples: true };
    expect(normaliseMockValue(base, overrides as any)).toEqual({
      type: "msw",
      delay: 50,
      useExamples: true
    });
  });

  it("forces enablement when override enabled is true", () => {
    expect(normaliseMockValue(false, { enabled: true })).toEqual({ type: "msw" });
  });
});
