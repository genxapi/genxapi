import { sanitiseSourceForLog, type LoadedContractDocument } from "../contracts";
import type { OrchestrationNextStep } from "../release";
import type { SchemaChangeResult } from "./types";

export interface ContractDiffReport {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly tool: {
    readonly name: "@genxapi/cli";
    readonly version: string;
  };
  readonly base: ContractDiffReportSource;
  readonly head: ContractDiffReportSource;
  readonly result: SchemaChangeResult;
  readonly nextSteps: readonly OrchestrationNextStep[];
}

export interface ContractDiffReportSource {
  readonly source: string;
  readonly resolvedSource: string;
  readonly type: LoadedContractDocument["type"];
  readonly info: LoadedContractDocument["info"];
  readonly metadata: LoadedContractDocument["metadata"];
}

export interface BuildContractDiffReportOptions {
  readonly base: LoadedContractDocument;
  readonly head: LoadedContractDocument;
  readonly generatedAt: string;
  readonly toolVersion?: string;
  readonly result: SchemaChangeResult;
}

export function buildContractDiffReport(
  options: BuildContractDiffReportOptions,
): ContractDiffReport {
  return {
    schemaVersion: 1,
    generatedAt: options.generatedAt,
    tool: {
      name: "@genxapi/cli",
      version: options.toolVersion ?? "unknown",
    },
    base: summariseSource(options.base),
    head: summariseSource(options.head),
    result: options.result,
    nextSteps: buildDiffNextSteps(options.result),
  };
}

export function renderContractDiffReport(report: ContractDiffReport): string {
  const lines: string[] = [];
  const { classification } = report.result;
  const { counts } = classification;

  lines.push("GenX API contract diff");
  lines.push(`Base: ${report.base.source}`);
  lines.push(`Head: ${report.head.source}`);
  lines.push(`Summary: ${report.result.summary}`);
  lines.push(`Change level: ${classification.changeLevel}`);
  lines.push(
    `Release signal: ${renderReleaseSignal(classification.releaseSignal)}`,
  );
  lines.push(
    `Counts: ${counts.additions} additions, ${counts.removals} removals, ${counts.modifications} structural changes, ${counts.docChanges} docs-only changes`,
  );

  if (report.base.info?.version || report.head.info?.version) {
    lines.push(
      `Contract versions: ${report.base.info?.version ?? "unknown"} -> ${report.head.info?.version ?? "unknown"}`,
    );
  }

  appendSection(lines, "Additions", report.result.diff.additions);
  appendSection(lines, "Removals", report.result.diff.removals);
  appendSection(lines, "Structural changes", report.result.diff.modifications);
  appendSection(lines, "Documentation-only changes", report.result.diff.docChanges);

  lines.push("");
  lines.push("Next steps:");
  for (const step of report.nextSteps) {
    lines.push(`- ${step.label}${step.reason ? ` (${step.reason})` : ""}`);
  }

  return `${lines.join("\n")}\n`;
}

function appendSection(lines: string[], heading: string, entries: readonly string[]): void {
  if (entries.length === 0) {
    return;
  }

  lines.push("");
  lines.push(`${heading}:`);
  for (const entry of entries) {
    lines.push(`- ${entry}`);
  }
}

function summariseSource(document: LoadedContractDocument): ContractDiffReportSource {
  return {
    source: sanitiseSourceForLog(document.source),
    resolvedSource: sanitiseSourceForLog(document.resolvedSource),
    type: document.type,
    info: document.info
      ? {
          ...document.info,
          source: sanitiseSourceForLog(document.info.source),
        }
      : null,
    metadata: document.metadata,
  };
}

function buildDiffNextSteps(result: SchemaChangeResult): readonly OrchestrationNextStep[] {
  const { changeLevel, releaseSignal } = result.classification;

  switch (changeLevel) {
    case "none":
      return [
        {
          id: "skip-release",
          label: "No contract changes detected. Skip release work unless template or config changes still need generation.",
          kind: "release",
          automated: false,
        },
      ];
    case "documentation":
      return [
        {
          id: "review-doc-changes",
          label: "Review the documentation-only contract changes and decide whether regenerated package docs should be refreshed.",
          kind: "review",
          automated: false,
        },
        {
          id: "run-generate-after-doc-diff",
          label: "Run generate if the package surface or bundled documentation should reflect the updated contract text.",
          kind: "generate",
          automated: false,
        },
      ];
    case "additive":
      return [
        {
          id: "run-generate-after-additive-diff",
          label: "Run generate so the package includes the newly detected contract additions.",
          kind: "generate",
          automated: false,
        },
        {
          id: "review-minor-versioning",
          label: "Treat the result as a minor-version candidate, but keep the final version decision manual.",
          kind: "review",
          automated: false,
          reason: `release signal=${releaseSignal.level}`,
        },
      ];
    case "structural":
    default:
      return [
        {
          id: "review-structural-contract-changes",
          label: "Review structural contract changes manually before deciding the release impact.",
          kind: "review",
          automated: false,
          reason: "Breaking versus compatible structural changes are not separated yet.",
        },
        {
          id: "run-generate-after-structural-diff",
          label: "Run generate and inspect the package diff before versioning or publishing.",
          kind: "generate",
          automated: false,
        },
      ];
  }
}

function renderReleaseSignal(
  signal: SchemaChangeResult["classification"]["releaseSignal"],
): string {
  switch (signal.level) {
    case "none":
      return "no version bump suggested";
    case "candidate-minor":
      return "minor-version candidate (manual review required)";
    case "manual-review":
    default:
      return "manual review required";
  }
}
