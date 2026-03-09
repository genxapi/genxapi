import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MultiClientConfig, TemplatePlan } from "../types.js";
import type { SwaggerInfo } from "./handleSwaggerDocuments.js";

export async function generateReadme(
  projectDir: string,
  config: MultiClientConfig,
  swaggerInfos: Record<string, SwaggerInfo | null>,
  templatePlan?: TemplatePlan
): Promise<void> {
  const readmeConfig = config.project.readme;
  const lines: string[] = [];
  const projectName = config.project.name;
  lines.push(`# ${projectName}`);
  lines.push("");

  const intro = readmeConfig?.introduction
    ? readmeConfig.introduction
    : `This package contains generated API clients produced by \`@genxapi/cli\` using the Orval toolchain.`;
  lines.push(intro);
  lines.push("");

  lines.push("## Clients");
  lines.push("");
  lines.push("| Client | OpenAPI Source | Base URL | Description |");
  lines.push("| ------ | -------------- | -------- | ----------- |");
  for (const client of config.clients) {
    const info = swaggerInfos[client.name];
    const swaggerLabel = info?.title ?? client.swagger;
    const swaggerLink = `[${swaggerLabel}](${info?.source ?? client.swagger})`;
    const baseUrl = client.orval?.baseUrl ?? "—";
    const description = info?.description ? info.description.replace(/\n+/g, " ") : "—";
    lines.push(`| ${client.name} | ${swaggerLink} | ${baseUrl} | ${description} |`);
  }
  lines.push("");

  const usageLines: string[] = [];
  if (readmeConfig?.usage) {
    usageLines.push(readmeConfig.usage);
  } else {
    usageLines.push("Install dependencies and regenerate clients:");
    usageLines.push("");
    usageLines.push("```bash");
    usageLines.push("npm install");
    usageLines.push("npm run generate-clients");
    usageLines.push("```");
    usageLines.push("");
    usageLines.push("The generated Orval configuration is available at `orval.config.ts`.");
  }
  lines.push("## Usage");
  lines.push("");
  lines.push(...usageLines);
  lines.push("");

  if (templatePlan) {
    lines.push("## Template Boundaries");
    lines.push("");
    if (templatePlan.selectedCapabilities.length > 0) {
      lines.push(
        `Selected template capabilities: ${templatePlan.selectedCapabilities
          .map((capability) => `\`${capability}\``)
          .join(", ")}.`
      );
      lines.push("");
    }
    if (templatePlan.output?.configFiles?.length) {
      lines.push(
        `Template-owned config files: ${templatePlan.output.configFiles
          .map((file) => `\`${file}\``)
          .join(", ")}.`
      );
      lines.push("");
    }
    if (templatePlan.output?.entrypoints?.length) {
      lines.push(
        `Generated package entrypoints: ${templatePlan.output.entrypoints
          .map((file) => `\`${file}\``)
          .join(", ")}.`
      );
      lines.push("");
    }
    if (templatePlan.output?.notes?.length) {
      for (const note of templatePlan.output.notes) {
        lines.push(note);
        lines.push("");
      }
    }
    if (templatePlan.documentationHints?.length) {
      for (const hint of templatePlan.documentationHints) {
        lines.push(`### ${hint.title}`);
        lines.push("");
        lines.push(hint.body);
        lines.push("");
      }
    }
  }

  if (readmeConfig?.additionalSections) {
    for (const section of readmeConfig.additionalSections) {
      lines.push(`## ${section.title}`);
      lines.push("");
      lines.push(section.body);
      lines.push("");
    }
  }

  await writeFile(join(projectDir, "README.md"), `${lines.join("\n")}\n`);
}
