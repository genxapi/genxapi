import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import fs from "fs-extra";
import type { CliConfig } from "src/config/loader";
import type { TemplateGenerationPlan, TemplateModule } from "src/config/loader/templateModule";
import type { OrchestrationNextStep } from "src/utils/release";
import type { NpmPublishConfig } from "src/services/npm";
import type { ResolvedContractSource } from "src/utils/contracts";
import { sanitiseSourceForLog } from "src/utils/contracts";

type PlanClientShape = {
  readonly name: string;
  readonly output?: {
    readonly workspace?: string;
    readonly target?: string;
    readonly schemas?: string;
  };
};

type PlannedActionId =
  | "resolve-contracts"
  | "generate-clients"
  | "write-generation-manifest"
  | "synchronize-repository"
  | "build-generated-package"
  | "publish-npm"
  | "publish-github";

export interface GenerationPlanAction {
  readonly id: PlannedActionId;
  readonly label: string;
  readonly enabled: boolean;
  readonly reason?: string;
  readonly details?: Record<string, unknown>;
}

export interface GenerationPlanReport {
  readonly schemaVersion: 1;
  readonly dryRun: boolean;
  readonly generatedAt: string;
  readonly contractVersion?: string;
  readonly tool: {
    readonly name: "@genxapi/cli";
    readonly version: string;
  };
  readonly template: {
    readonly kind: string;
    readonly name: string;
    readonly displayName: string;
    readonly summary: string;
  };
  readonly project: {
    readonly name: string;
    readonly directory: string;
    readonly absoluteDirectory: string;
    readonly packageManager: string;
    readonly runGenerate: boolean;
  };
  readonly manifest: {
    readonly path: string;
  };
  readonly templatePlan: TemplateGenerationPlan;
  readonly clients: ReadonlyArray<{
    readonly name: string;
    readonly contract: {
      readonly source: string;
      readonly resolvedSource: string;
      readonly type: "local" | "remote";
      readonly generatorInput: string;
      readonly snapshot: ResolvedContractSource["snapshot"];
      readonly checksum?: ResolvedContractSource["checksum"];
      readonly info: ResolvedContractSource["info"];
      readonly metadata: ResolvedContractSource["metadata"];
    };
    readonly output?: PlanClientShape["output"];
  }>;
  readonly plannedActions: readonly GenerationPlanAction[];
  readonly nextSteps: readonly OrchestrationNextStep[];
}

export interface BuildGenerationPlanReportOptions {
  readonly config: CliConfig;
  readonly projectDir: string;
  readonly template: TemplateModule;
  readonly templateKind: string;
  readonly templatePlan: TemplateGenerationPlan;
  readonly clients: readonly PlanClientShape[];
  readonly resolvedContracts: Record<string, ResolvedContractSource>;
  readonly generatedAt: string;
  readonly dryRun: boolean;
  readonly toolVersion?: string;
  readonly contractVersion?: string;
}

export function buildGenerationPlanReport(
  options: BuildGenerationPlanReportOptions,
): GenerationPlanReport {
  const manifestPath = join(options.projectDir, "genxapi.manifest.json");
  const plannedActions = buildPlannedActions(options.config);

  return {
    schemaVersion: 1,
    dryRun: options.dryRun,
    generatedAt: options.generatedAt,
    contractVersion: options.contractVersion,
    tool: {
      name: "@genxapi/cli",
      version: options.toolVersion ?? "unknown",
    },
    template: {
      kind: options.templateKind,
      name: options.template.name,
      displayName: options.template.displayName,
      summary: options.template.capabilityManifest.summary,
    },
    project: {
      name: options.config.project.name,
      directory: options.config.project.directory,
      absoluteDirectory: options.projectDir,
      packageManager: options.config.project.packageManager,
      runGenerate: options.config.project.runGenerate,
    },
    manifest: {
      path: manifestPath,
    },
    templatePlan: options.templatePlan,
    clients: options.clients.map((client) => {
      const resolvedContract = options.resolvedContracts[client.name];
      return {
        name: client.name,
        contract: {
          source: sanitiseSourceForLog(resolvedContract.source),
          resolvedSource: sanitiseSourceForLog(resolvedContract.resolvedSource),
          type: resolvedContract.type,
          generatorInput: resolvedContract.generatorInput,
          snapshot: resolvedContract.snapshot,
          checksum: resolvedContract.checksum,
          info: resolvedContract.info,
          metadata: resolvedContract.metadata,
        },
        output: client.output,
      };
    }),
    plannedActions,
    nextSteps: buildNextSteps(plannedActions, options.dryRun),
  };
}

export function renderGenerationPlanReport(report: GenerationPlanReport): string {
  const lines: string[] = [];
  lines.push("GenX API generation plan");
  lines.push(`Template: ${report.template.name} (${report.template.kind})`);
  lines.push(`Project: ${report.project.name} -> ${report.project.directory}`);
  lines.push(`Manifest: ${report.manifest.path}`);
  if (report.contractVersion) {
    lines.push(`Contract version: ${report.contractVersion}`);
  }
  lines.push(`Dry run: ${report.dryRun ? "yes" : "no"}`);
  lines.push(`Run native generator: ${report.project.runGenerate ? "yes" : "no"}`);
  lines.push("");
  lines.push("Clients:");

  for (const client of report.clients) {
    lines.push(`- ${client.name}`);
    lines.push(`  contract source: ${client.contract.source}`);
    lines.push(`  contract type: ${client.contract.type}`);
    lines.push(`  generator input: ${client.contract.generatorInput}`);
    if (client.contract.snapshot.enabled) {
      lines.push(`  snapshot path: ${client.contract.snapshot.path ?? "(configured by template)"}`);
    }
    if (client.output?.workspace) {
      lines.push(`  workspace output: ${client.output.workspace}`);
    }
    if (client.output?.target) {
      lines.push(`  target output: ${client.output.target}`);
    }
    if (client.output?.schemas) {
      lines.push(`  schema output: ${client.output.schemas}`);
    }
  }

  lines.push("");
  lines.push(
    `Selected template capabilities: ${
      report.templatePlan.selectedCapabilities.length > 0
        ? report.templatePlan.selectedCapabilities.join(", ")
        : "none"
    }`,
  );

  if (report.templatePlan.dependencies.length > 0) {
    lines.push("Template dependency plan:");
    for (const dependency of report.templatePlan.dependencies) {
      lines.push(`- ${dependency.section}: ${dependency.name}`);
    }
  }

  lines.push("");
  lines.push("Planned actions:");
  for (const action of report.plannedActions) {
    lines.push(
      `- ${action.enabled ? "run" : "skip"} ${action.label}${
        action.reason ? ` (${action.reason})` : ""
      }`,
    );
  }

  lines.push("");
  lines.push("Next steps:");
  for (const step of report.nextSteps) {
    lines.push(`- ${step.label}${step.reason ? ` (${step.reason})` : ""}`);
  }

  return `${lines.join("\n")}\n`;
}

export async function writeGenerationPlanReport(
  filePath: string,
  report: GenerationPlanReport,
): Promise<void> {
  await fs.ensureDir(dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function buildPlannedActions(config: CliConfig): readonly GenerationPlanAction[] {
  const repositoryEnabled = Boolean(config.project.repository);
  const npmPublish = config.project.publish?.npm as NpmPublishConfig | undefined;
  const githubPublish = normaliseGithubPublish(
    config.project.publish?.github as NpmPublishConfig | undefined,
  );
  const buildEnabled = Boolean(npmPublish?.enabled || githubPublish?.enabled);

  return [
    {
      id: "resolve-contracts",
      label: "Resolve contract sources and reproducibility metadata",
      enabled: true,
    },
    {
      id: "generate-clients",
      label: "Run template generation",
      enabled: true,
      details: {
        runGenerate: config.project.runGenerate,
      },
    },
    {
      id: "write-generation-manifest",
      label: "Write generation manifest",
      enabled: true,
    },
    {
      id: "synchronize-repository",
      label: "Synchronize repository changes",
      enabled: repositoryEnabled,
      reason: repositoryEnabled ? undefined : "project.repository is not configured",
    },
    {
      id: "build-generated-package",
      label: "Build generated package before publishing",
      enabled: buildEnabled,
      reason: buildEnabled ? undefined : "no publish target is enabled",
    },
    {
      id: "publish-npm",
      label: "Publish to npm registry",
      enabled: Boolean(npmPublish?.enabled),
      reason: npmPublish?.enabled ? undefined : "project.publish.npm.enabled is not true",
      details: npmPublish
        ? {
            registry: npmPublish.registry ?? "https://registry.npmjs.org/",
            command: npmPublish.command ?? config.project.packageManager,
            dryRun: npmPublish.dryRun ?? false,
          }
        : undefined,
    },
    {
      id: "publish-github",
      label: "Publish to GitHub Packages",
      enabled: Boolean(githubPublish?.enabled),
      reason: githubPublish?.enabled ? undefined : "project.publish.github.enabled is not true",
      details: githubPublish
        ? {
            registry: githubPublish.registry,
            command: githubPublish.command ?? config.project.packageManager,
            dryRun: githubPublish.dryRun ?? false,
          }
        : undefined,
    },
  ];
}

function buildNextSteps(
  plannedActions: readonly GenerationPlanAction[],
  dryRun: boolean,
): readonly OrchestrationNextStep[] {
  if (dryRun) {
    return [
      {
        id: "run-generate-from-plan",
        label:
          "Run generate without --dry-run to write clients, the generation manifest, and any configured post-generation actions.",
        kind: "generate",
        automated: false,
      },
      ...plannedActions
        .filter((action) =>
          [
            "synchronize-repository",
            "build-generated-package",
            "publish-npm",
            "publish-github",
          ].includes(action.id) && action.enabled,
        )
        .map((action) => ({
          id: `planned-${action.id}`,
          label: action.label,
          kind: mapActionKind(action.id),
          automated: true,
          actionId: action.id,
        })),
    ];
  }

  const nextSteps: OrchestrationNextStep[] = [
    {
      id: "review-generated-output",
      label:
        "Review generated package changes together with genxapi.manifest.json before promoting or tagging a release.",
      kind: "review",
      automated: false,
    },
  ];

  if (plannedActions.some((action) => action.id === "synchronize-repository" && action.enabled)) {
    nextSteps.push({
      id: "verify-repository-sync",
      label: "Verify the repository synchronization result produced by this run.",
      kind: "review",
      automated: false,
      actionId: "synchronize-repository",
    });
  }

  if (
    plannedActions.some((action) =>
      ["publish-npm", "publish-github"].includes(action.id) && action.enabled,
    )
  ) {
    nextSteps.push({
      id: "verify-published-artifacts",
      label: "Verify registry or package-hosting results for the publish automation triggered by this run.",
      kind: "publish",
      automated: false,
    });
  }

  return nextSteps;
}

function mapActionKind(actionId: GenerationPlanAction["id"]): OrchestrationNextStep["kind"] {
  switch (actionId) {
    case "build-generated-package":
      return "build";
    case "publish-npm":
    case "publish-github":
      return "publish";
    case "synchronize-repository":
      return "release";
    case "resolve-contracts":
    case "generate-clients":
    case "write-generation-manifest":
    default:
      return "generate";
  }
}

function normaliseGithubPublish(
  config: NpmPublishConfig | undefined,
): NpmPublishConfig | undefined {
  if (!config) {
    return undefined;
  }

  return {
    ...config,
    registry: config.registry ?? "https://npm.pkg.github.com",
    tokenEnv: config.tokenEnv ?? "GITHUB_TOKEN",
    access: config.access ?? "restricted",
  };
}
