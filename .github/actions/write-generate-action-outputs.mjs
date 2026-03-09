import { appendFileSync, readFileSync } from "node:fs";

const [planPath, githubOutputPath] = process.argv.slice(2);

if (!planPath || !githubOutputPath) {
  throw new Error("Usage: node write-generate-action-outputs.mjs <plan-path> <github-output-path>");
}

const plan = JSON.parse(readFileSync(planPath, "utf8"));

const outputs = {
  dry_run: String(plan.dryRun ?? false),
  plan_path: planPath,
  manifest_path: plan.manifest?.path ?? "",
  template_name: plan.template?.name ?? "",
  template_kind: plan.template?.kind ?? "",
  project_name: plan.project?.name ?? "",
  project_directory: plan.project?.directory ?? "",
  contract_version: plan.contractVersion ?? "",
  contracts_json: JSON.stringify(
    Array.isArray(plan.clients)
      ? plan.clients.map((client) => ({
          name: client.name,
          contract: client.contract,
        }))
      : [],
  ),
  outputs_json: JSON.stringify(
    Array.isArray(plan.clients)
      ? plan.clients.map((client) => ({
          name: client.name,
          output: client.output ?? {},
        }))
      : [],
  ),
  planned_actions_json: JSON.stringify(plan.plannedActions ?? []),
  selected_capabilities_json: JSON.stringify(plan.templatePlan?.selectedCapabilities ?? []),
};

let content = "";
for (const [key, value] of Object.entries(outputs)) {
  content += `${key}<<__GENXAPI__\n${value}\n__GENXAPI__\n`;
}

appendFileSync(githubOutputPath, content);
