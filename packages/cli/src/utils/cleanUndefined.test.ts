import { describe, expect, it } from "vitest";
import { cleanUndefined } from "./cleanUndefined";

describe("cleanUndefined", () => {
  it("removes undefined properties", () => {
    const input = { a: 1, b: undefined, c: null };
    expect(cleanUndefined(input)).toEqual({ a: 1, c: null });
  });
});
