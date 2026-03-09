export type ChangeType = "feat" | "fix" | "chore";
export type ChangeLevel = "none" | "documentation" | "additive" | "structural";
export type ReleaseSignalLevel = "none" | "candidate-minor" | "manual-review";

export interface DiffReport {
  readonly additions: string[];
  readonly removals: string[];
  readonly modifications: string[];
  readonly docChanges: string[];
}

export interface ChangeClassification {
  readonly schemaVersion: 1;
  readonly changeLevel: ChangeLevel;
  readonly summaryType: ChangeType;
  readonly counts: {
    readonly additions: number;
    readonly removals: number;
    readonly modifications: number;
    readonly docChanges: number;
  };
  readonly releaseSignal: {
    readonly level: ReleaseSignalLevel;
    readonly suggestedVersionBump: "none" | "minor" | null;
    readonly semverAutomationSupported: false;
    readonly requiresManualReview: boolean;
  };
}

export interface SchemaChangeResult {
  type: ChangeType;
  summary: string;
  diff: DiffReport;
  classification: ChangeClassification;
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
