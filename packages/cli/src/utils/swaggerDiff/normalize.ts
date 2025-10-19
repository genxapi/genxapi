import { DOC_FIELDS } from "./types.js";

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

export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

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

export function clone<T>(value: T): T {
  return value === undefined ? value : (structuredClone(value) as T);
}
