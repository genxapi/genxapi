import { HTTP_METHODS, type ChangeType, type DiffReport } from "./types.js";

const METHOD_PATTERN = /^operation\s+(\w+)/i;

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

function extractOperationMethod(entry: string): string | null {
  const match = entry.match(METHOD_PATTERN);
  if (!match) return null;
  const method = match[1].toLowerCase();
  return HTTP_METHODS.includes(method) ? method : null;
}
