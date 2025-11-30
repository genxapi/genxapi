import { HTTP_METHODS, type DiffReport } from "./types.js";
import { clone, deepEqual, stripDocFields } from "./normalize.js";

/**
 * Populates a diff report with path-level changes between two OpenAPI specs.
 *
 * @param diff - Mutable diff accumulator.
 * @param oldPaths - Paths object from the previous spec.
 * @param newPaths - Paths object from the updated spec.
 */
export function analyzePaths(
  diff: DiffReport,
  oldPaths: Record<string, unknown>,
  newPaths: Record<string, unknown>
): void {
  const oldPathKeys = new Set(Object.keys(oldPaths));
  const newPathKeys = new Set(Object.keys(newPaths));

  for (const path of newPathKeys) {
    if (!oldPathKeys.has(path)) {
      diff.additions.push(`path ${path}`);
      const newItem = newPaths[path] as Record<string, unknown>;
      for (const method of Object.keys(newItem ?? {})) {
        if (HTTP_METHODS.includes(method.toLowerCase())) {
          diff.additions.push(`operation ${method.toUpperCase()} ${path}`);
        }
      }
    }
  }

  for (const path of oldPathKeys) {
    if (!newPathKeys.has(path)) {
      diff.modifications.push(`operation path removed ${path}`);
    }
  }

  for (const path of oldPathKeys) {
    if (!newPathKeys.has(path)) continue;
    const oldItem = oldPaths[path] as Record<string, unknown>;
    const newItem = newPaths[path] as Record<string, unknown>;
    analyzeMethods(diff, path, oldItem, newItem);
  }
}

/**
 * Records method-level additions/removals/changes for a given path.
 *
 * @param diff - Mutable diff accumulator.
 * @param path - Current API path being compared.
 * @param oldItem - Operations in the previous spec.
 * @param newItem - Operations in the updated spec.
 */
function analyzeMethods(
  diff: DiffReport,
  path: string,
  oldItem: Record<string, unknown>,
  newItem: Record<string, unknown>
) {
  const oldMethods = Object.keys(oldItem).filter((key) => HTTP_METHODS.includes(key.toLowerCase()));
  const newMethods = Object.keys(newItem).filter((key) => HTTP_METHODS.includes(key.toLowerCase()));

  const oldSet = new Set(oldMethods);
  const newSet = new Set(newMethods);

  for (const method of newSet) {
    if (!oldSet.has(method)) {
      diff.additions.push(`operation ${method.toUpperCase()} ${path}`);
    }
  }

  for (const method of oldSet) {
    if (!newSet.has(method)) {
      diff.modifications.push(`operation removed ${method.toUpperCase()} ${path}`);
    }
  }

  for (const method of oldSet) {
    if (!newSet.has(method)) continue;
    const oldOperation = clone(oldItem[method]);
    const newOperation = clone(newItem[method]);

    if (deepEqual(oldOperation, newOperation)) {
      continue;
    }

    const oldStruct = stripDocFields(oldOperation);
    const newStruct = stripDocFields(newOperation);

    if (deepEqual(oldStruct, newStruct)) {
      diff.docChanges.push(`operation docs ${method.toUpperCase()} ${path}`);
    } else {
      diff.modifications.push(`operation changed ${method.toUpperCase()} ${path}`);
    }
  }
}
