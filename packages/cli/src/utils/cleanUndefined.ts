/**
 * Returns a shallow copy of an object without undefined-valued keys.
 *
 * @param value - Object to prune.
 * @returns Copy with only defined properties.
 */
export function cleanUndefined<T extends Record<string, unknown>>(value: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result as T;
}
