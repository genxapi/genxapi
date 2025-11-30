import { analyzeComponents } from "./components.js";
import { analyzePaths } from "./paths.js";
import { buildSummary, determineResultType } from "./summary.js";
import type { SchemaChangeResult } from "./types.js";
import type { DiffReport } from "./types.js";

export { type SchemaChangeResult } from "./types.js";

/**
 * Generates a summary diff between two OpenAPI specs.
 *
 * @param oldSpec - Previous OpenAPI document.
 * @param newSpec - Updated OpenAPI document.
 * @returns Structured diff with type, summary, and detailed changes.
 */
export function analyzeSwaggerDiff(
  oldSpec: Record<string, unknown>,
  newSpec: Record<string, unknown>
): SchemaChangeResult {
  const diff: DiffReport = {
    additions: [],
    removals: [],
    modifications: [],
    docChanges: []
  };

  analyzePaths(
    diff,
    (oldSpec?.paths ?? {}) as Record<string, unknown>,
    (newSpec?.paths ?? {}) as Record<string, unknown>
  );

  analyzeComponents(
    diff,
    (oldSpec?.components ?? {}) as Record<string, unknown>,
    (newSpec?.components ?? {}) as Record<string, unknown>
  );

  const type = determineResultType(diff);
  const summary = buildSummary(type, diff);

  return { type, summary, diff };
}
