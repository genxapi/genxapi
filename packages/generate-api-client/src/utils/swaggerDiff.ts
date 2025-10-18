type ChangeType = "feat" | "fix" | "chore";

interface DiffReport {
  readonly additions: string[];
  readonly removals: string[];
  readonly modifications: string[];
  readonly docChanges: string[];
}

export interface SchemaChangeResult {
  type: ChangeType;
  summary: string;
  diff: DiffReport;
}

const DOC_FIELDS = new Set([
  "description",
  "summary",
  "externalDocs",
  "example",
  "examples",
  "termsOfService",
  "contact",
  "license"
]);

const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

export function analyzeSwaggerDiff(oldSpec: Record<string, unknown>, newSpec: Record<string, unknown>): SchemaChangeResult {
  const diff: DiffReport = {
    additions: [],
    removals: [],
    modifications: [],
    docChanges: []
  };

  analyzePaths(diff, oldSpec?.paths ?? {}, newSpec?.paths ?? {});
  analyzeComponents(diff, oldSpec?.components ?? {}, newSpec?.components ?? {});

  const resultType = determineResultType(diff);
  const summary = buildSummary(resultType, diff);

  return { type: resultType, summary, diff };
}

function analyzePaths(diff: DiffReport, oldPaths: Record<string, unknown>, newPaths: Record<string, unknown>) {
  const oldPathKeys = new Set(Object.keys(oldPaths));
  const newPathKeys = new Set(Object.keys(newPaths));

  for (const path of newPathKeys) {
    if (!oldPathKeys.has(path)) {
      diff.additions.push(`path ${path}`);
      const newItem = (newPaths as Record<string, unknown>)[path] as Record<string, unknown>;
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
    const oldItem = (oldPaths as Record<string, unknown>)[path] as Record<string, unknown>;
    const newItem = (newPaths as Record<string, unknown>)[path] as Record<string, unknown>;

    analyzeMethods(diff, path, oldItem, newItem);
  }
}

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
    const oldOperation = clone((oldItem as Record<string, unknown>)[method]);
    const newOperation = clone((newItem as Record<string, unknown>)[method]);

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

function analyzeComponents(diff: DiffReport, oldComponents: Record<string, unknown>, newComponents: Record<string, unknown>) {
  const oldSchemas = ((oldComponents?.schemas as Record<string, unknown>) ?? {}) as Record<string, unknown>;
  const newSchemas = ((newComponents?.schemas as Record<string, unknown>) ?? {}) as Record<string, unknown>;

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

function determineResultType(diff: DiffReport): ChangeType {
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

function buildSummary(type: ChangeType, diff: DiffReport): string {
  switch (type) {
    case "feat": {
      const preferred =
        diff.additions.find((entry) => extractOperationMethod(entry) !== null) ?? diff.additions[0];
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
    return entry.replace(/^path /, "path ");
  }
  return entry.replace(/^operation /, "").replace(/^schema /, "");
}

function extractOperationMethod(entry: string): string | null {
  const match = entry.match(/^operation\s+(\w+)/i);
  if (!match) {
    return null;
  }
  const method = match[1].toLowerCase();
  return HTTP_METHODS.includes(method) ? method : null;
}

function stripDocFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripDocFields(item));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (DOC_FIELDS.has(key)) {
        continue;
      }
      result[key] = stripDocFields(val);
    }
    return result;
  }
  return value;
}

function deepEqual(a: unknown, b: unknown): boolean {
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

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}
