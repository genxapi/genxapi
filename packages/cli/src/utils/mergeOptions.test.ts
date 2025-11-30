import { describe, expect, it } from "vitest";
import { mergeOptions } from "./mergeOptions";

describe("mergeOptions", () => {
  it("deep merges objects and ignores undefined", () => {
    type Input = { foo: { bar?: number; qux?: number }; baz?: number };
    const a: Input = { foo: { bar: 1 }, baz: 2 };
    const b: Input = { foo: { qux: 3 } };
    expect(mergeOptions<Input>(a, undefined, b)).toEqual({
      foo: { bar: 1, qux: 3 },
      baz: 2
    });
  });
});
