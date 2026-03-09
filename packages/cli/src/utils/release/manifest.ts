import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import fs from "fs-extra";
import { cleanUndefined } from "../cleanUndefined";
import type { GenerationPlanReport } from "../generation/planReport";
import type { ContractDiffReport } from "../swaggerDiff/report";
import type { OrchestrationNextStep, ReleaseManifest } from "./types";

export interface WriteReleaseManifestOptions {
  readonly filePath: string;
  readonly generatedAt: string;
  readonly toolVersion?: string;
  readonly contractVersion?: string;
  readonly project?: {
    readonly name: string;
    readonly directory: string;
  };
  readonly template?: {
    readonly kind: string;
    readonly name: string;
  };
  readonly diffReport?: ContractDiffReport;
  readonly generationReport?: GenerationPlanReport;
}

export async function writeReleaseManifest(
  options: WriteReleaseManifestOptions,
): Promise<ReleaseManifest> {
  const existing = await readExistingReleaseManifest(options.filePath);
  const diffSection = options.diffReport
    ? {
        base: options.diffReport.base,
        head: options.diffReport.head,
        result: options.diffReport.result,
        nextSteps: options.diffReport.nextSteps,
      }
    : existing?.diff;
  const generationSection = options.generationReport
    ? {
        dryRun: options.generationReport.dryRun,
        manifestPath: options.generationReport.manifest.path,
        clients: options.generationReport.clients,
        plannedActions: options.generationReport.plannedActions,
        nextSteps: options.generationReport.nextSteps,
      }
    : existing?.generation;

  const manifest: ReleaseManifest = cleanUndefined({
    schemaVersion: 1,
    generatedAt: options.generatedAt,
    contractVersion: options.contractVersion ?? existing?.contractVersion,
    tool: {
      name: "@genxapi/cli",
      version: options.toolVersion ?? existing?.tool.version ?? "unknown",
    },
    project: options.project ?? existing?.project,
    template: options.template ?? existing?.template,
    diff: diffSection,
    generation: generationSection,
    release: {
      classification: diffSection?.result.classification ?? existing?.release.classification,
      nextSteps: mergeNextSteps(
        existing?.release.nextSteps ?? [],
        diffSection?.nextSteps ?? [],
        generationSection?.nextSteps ?? [],
      ),
    },
  }) as ReleaseManifest;

  await fs.ensureDir(dirname(options.filePath));
  await writeFile(options.filePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

async function readExistingReleaseManifest(filePath: string): Promise<ReleaseManifest | null> {
  try {
    const contents = await readFile(filePath, "utf8");
    return JSON.parse(contents) as ReleaseManifest;
  } catch (error) {
    if (isMissingFile(error)) {
      return null;
    }

    throw error;
  }
}

function mergeNextSteps(
  ...groups: ReadonlyArray<readonly OrchestrationNextStep[]>
): readonly OrchestrationNextStep[] {
  const merged = new Map<string, OrchestrationNextStep>();

  for (const group of groups) {
    for (const step of group) {
      merged.set(step.id, step);
    }
  }

  return Array.from(merged.values());
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
