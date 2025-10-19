export type ChangeType = "feat" | "fix" | "chore";

export interface DiffReport {
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

export const DOC_FIELDS = new Set([
  "description",
  "summary",
  "externalDocs",
  "example",
  "examples",
  "termsOfService",
  "contact",
  "license"
]);

export const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace"
];
