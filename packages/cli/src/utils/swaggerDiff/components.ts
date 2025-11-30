import { clone, deepEqual, stripDocFields } from "./normalize.js";
import type { DiffReport } from "./types.js";

/**
 * Records schema/component-level changes between two OpenAPI specs.
 *
 * @param diff - Mutable diff accumulator.
 * @param oldComponents - Components from the previous spec.
 * @param newComponents - Components from the updated spec.
 */
export function analyzeComponents(
  diff: DiffReport,
  oldComponents: Record<string, unknown>,
  newComponents: Record<string, unknown>
): void {
  const oldSchemas = ((oldComponents?.schemas as Record<string, unknown>) ?? {}) as Record<
    string,
    unknown
  >;
  const newSchemas = ((newComponents?.schemas as Record<string, unknown>) ?? {}) as Record<
    string,
    unknown
  >;

  const oldKeys = new Set(Object.keys(oldSchemas));
  const newKeys = new Set(Object.keys(newSchemas));

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      diff.additions.push(`schema added components/schemas/${key}`);
    }
  }

  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      diff.modifications.push(`schema removed components/schemas/${key}`);
    }
  }

  for (const key of oldKeys) {
    if (!newKeys.has(key)) continue;
    const oldSchema = clone(oldSchemas[key]);
    const newSchema = clone(newSchemas[key]);
    if (deepEqual(oldSchema, newSchema)) {
      continue;
    }

    const oldStruct = stripDocFields(oldSchema);
    const newStruct = stripDocFields(newSchema);

    if (deepEqual(oldStruct, newStruct)) {
      diff.docChanges.push(`schema docs components/schemas/${key}`);
    } else {
      diff.modifications.push(`schema changed components/schemas/${key}`);
    }
  }
}
