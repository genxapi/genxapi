import { CliConfig } from "src/config/loader";
import { cleanUndefined } from "src/utils/cleanUndefined";
import { TemplateOverrides } from "src/types";
import { Mutable } from "./types.js";

function applyPublishOverrides(
  project: Mutable<CliConfig["project"]>,
  publishOverrides: TemplateOverrides["publish"] | undefined
): void {
  if (!publishOverrides?.npm) {
    return;
  }

  const publish: { [key: string]: unknown; npm?: Record<string, unknown> } =
    (project.publish as { [key: string]: unknown; npm?: Record<string, unknown> }) ?? {};
  const npmConfig: Record<string, unknown> = {
    ...(publish.npm as Record<string, unknown> | undefined)
  };
  const npmOverride = publishOverrides.npm;

  if (npmOverride.enabled !== undefined) {
    npmConfig.enabled = npmOverride.enabled;
  }
  if (npmOverride.tag !== undefined) {
    npmConfig.tag = npmOverride.tag;
  }
  if (npmOverride.access !== undefined) {
    npmConfig.access = npmOverride.access;
  }
  if (npmOverride.dryRun !== undefined) {
    npmConfig.dryRun = npmOverride.dryRun;
  }
  if (npmOverride.tokenEnv !== undefined) {
    npmConfig.tokenEnv = npmOverride.tokenEnv;
  }
  if (npmOverride.registry !== undefined) {
    npmConfig.registry = npmOverride.registry;
  }
  if (npmOverride.command !== undefined) {
    npmConfig.command = npmOverride.command;
  }

  publish.npm = cleanUndefined(npmConfig);
  project.publish = publish as Mutable<CliConfig["project"]>["publish"];
}

export function applyProjectOverrides(
  project: Mutable<CliConfig["project"]>,
  overrides: TemplateOverrides
): void {
  if (overrides.packageManager) {
    project.packageManager = overrides.packageManager;
  }

  applyPublishOverrides(project, overrides.publish);
}
