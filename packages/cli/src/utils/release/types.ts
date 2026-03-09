import type { GenerationPlanAction, GenerationPlanReport } from "../generation/planReport";
import type { ContractDiffReport } from "../swaggerDiff/report";
import type { ChangeClassification } from "../swaggerDiff/types";

export interface OrchestrationNextStep {
  readonly id: string;
  readonly label: string;
  readonly kind: "review" | "generate" | "build" | "publish" | "release";
  readonly automated: boolean;
  readonly reason?: string;
  readonly actionId?: GenerationPlanAction["id"];
}

export interface ReleaseManifest {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly tool: {
    readonly name: "@genxapi/cli";
    readonly version: string;
  };
  readonly contractVersion?: string;
  readonly project?: {
    readonly name: string;
    readonly directory: string;
  };
  readonly template?: {
    readonly kind: string;
    readonly name: string;
  };
  readonly diff?: {
    readonly base: ContractDiffReport["base"];
    readonly head: ContractDiffReport["head"];
    readonly result: ContractDiffReport["result"];
    readonly nextSteps: ContractDiffReport["nextSteps"];
  };
  readonly generation?: {
    readonly dryRun: GenerationPlanReport["dryRun"];
    readonly manifestPath: GenerationPlanReport["manifest"]["path"];
    readonly clients: GenerationPlanReport["clients"];
    readonly plannedActions: GenerationPlanReport["plannedActions"];
    readonly nextSteps: GenerationPlanReport["nextSteps"];
  };
  readonly release: {
    readonly classification?: ChangeClassification;
    readonly nextSteps: readonly OrchestrationNextStep[];
  };
}
