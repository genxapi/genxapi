import { DOC_FIELDS } from "./types";

/**
 * Removes documentation fields from an OpenAPI value recursively.
 *
 * @param value - Value to sanitize.
 * @returns Value without documentation-only fields.
 */
export function stripDocFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripDocFields(item));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (DOC_FIELDS.has(key)) continue;
      result[key] = stripDocFields(val);
    }
    return result;
  }
  return value;
}

/**
 * Performs a stable deep equality check using sorted keys.
 *
 * @param a - First value.
 * @param b - Second value.
 * @returns True when values are structurally equivalent.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

/**
 * Produces a stable representation of a value with sorted object keys for comparison.
 *
 * @param value - Value to normalize.
 * @returns Normalized value.
 */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => [key, normalize(val)] as const)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return Object.fromEntries(entries);
  }
  return value;
}

/**
 * Clones a value using structuredClone while preserving undefined.
 *
 * @param value - Value to clone.
 * @returns Cloned value.
 */
export function clone<T>(value: T): T {
  return value === undefined ? value : (structuredClone(value) as T);
}
