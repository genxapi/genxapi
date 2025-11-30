import { HTTP_METHODS, type ChangeType, type DiffReport } from "./types";

const METHOD_PATTERN = /^operation\s+(\w+)/i;

/**
 * Determines the overall change type for a diff report.
 *
 * @param diff - Aggregated API diff.
 * @returns Semantic change type (feat, fix, chore).
 */
export function determineResultType(diff: DiffReport): ChangeType {
  if (diff.modifications.length > 0 || diff.removals.length > 0) {
    return "fix";
  }
  if (diff.additions.length > 0) {
    return "feat";
  }
  if (diff.docChanges.length > 0) {
    return "chore";
  }
  return "chore";
}

/**
 * Builds a human-friendly summary line for a diff.
 *
 * @param type - Semantic change type.
 * @param diff - Aggregated API diff.
 * @returns Conventional commit style summary.
 */
export function buildSummary(type: ChangeType, diff: DiffReport): string {
  switch (type) {
    case "feat": {
      const preferred =
        diff.additions.find((entry) => extractOperationMethod(entry)) ?? diff.additions[0];
      const target = preferred ?? "introduce new API features";
      return `feat(api): ${formatDiffEntry(target)}`;
    }
    case "fix": {
      const target = diff.modifications[0] ?? diff.removals?.[0] ?? "adjust API definitions";
      return `fix(api): ${formatDiffEntry(target)}`;
    }
    case "chore": {
      const target = diff.docChanges[0] ?? "sync OpenAPI metadata";
      return `chore(api): ${formatDiffEntry(target)}`;
    }
    default:
      return "chore(api): update OpenAPI specification";
  }
}

/**
 * Formats a raw diff entry for display in summaries.
 *
 * @param entry - Diff entry text.
 * @returns Cleaned, human-readable entry.
 */
function formatDiffEntry(entry: string): string {
  const method = extractOperationMethod(entry);
  if (method) {
    return entry.replace(/^operation \w+\s+/i, `${method.toUpperCase()} `);
  }
  if (entry.startsWith("path ")) {
    return entry;
  }
  return entry.replace(/^operation /, "").replace(/^schema /, "");
}

/**
 * Pulls an HTTP method from a diff entry when present.
 *
 * @param entry - Diff entry text.
 * @returns Lowercase method or null when not applicable.
 */
function extractOperationMethod(entry: string): string | null {
  const match = entry.match(METHOD_PATTERN);
  if (!match) return null;
  const method = match[1].toLowerCase();
  return HTTP_METHODS.includes(method) ? method : null;
}
