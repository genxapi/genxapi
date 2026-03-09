import type { ChangeClassification, ChangeLevel, ChangeType, DiffReport } from "./types";

export function buildChangeClassification(
  summaryType: ChangeType,
  diff: DiffReport,
): ChangeClassification {
  const changeLevel = determineChangeLevel(diff);

  return {
    schemaVersion: 1,
    changeLevel,
    summaryType,
    counts: {
      additions: diff.additions.length,
      removals: diff.removals.length,
      modifications: diff.modifications.length,
      docChanges: diff.docChanges.length,
    },
    releaseSignal: buildReleaseSignal(changeLevel),
  };
}

function determineChangeLevel(diff: DiffReport): ChangeLevel {
  if (diff.removals.length > 0 || diff.modifications.length > 0) {
    return "structural";
  }

  if (diff.additions.length > 0) {
    return "additive";
  }

  if (diff.docChanges.length > 0) {
    return "documentation";
  }

  return "none";
}

function buildReleaseSignal(
  changeLevel: ChangeLevel,
): ChangeClassification["releaseSignal"] {
  switch (changeLevel) {
    case "none":
      return {
        level: "none",
        suggestedVersionBump: "none",
        semverAutomationSupported: false,
        requiresManualReview: false,
      };
    case "documentation":
      return {
        level: "none",
        suggestedVersionBump: "none",
        semverAutomationSupported: false,
        requiresManualReview: false,
      };
    case "additive":
      return {
        level: "candidate-minor",
        suggestedVersionBump: "minor",
        semverAutomationSupported: false,
        requiresManualReview: true,
      };
    case "structural":
    default:
      return {
        level: "manual-review",
        suggestedVersionBump: null,
        semverAutomationSupported: false,
        requiresManualReview: true,
      };
  }
}
