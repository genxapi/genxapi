import { CliConfig } from "src/config/loader";
import { cleanUndefined } from "src/utils/cleanUndefined";
import { TemplateOverrides } from "src/types";
import { Mutable } from "./types";

function applyPublishOverrides(
  project: Mutable<CliConfig["project"]>,
  publishOverrides: TemplateOverrides["publish"] | undefined
): void {
  if (!publishOverrides?.npm && !publishOverrides?.github) {
    return;
  }

  const publish: { [key: string]: unknown; npm?: Record<string, unknown>; github?: Record<string, unknown> } =
    (project.publish as {
      [key: string]: unknown;
      npm?: Record<string, unknown>;
      github?: Record<string, unknown>;
    }) ?? {};

  if (publishOverrides.npm) {
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
  }

  if (publishOverrides.github) {
    const githubConfig: Record<string, unknown> = {
      ...(publish.github as Record<string, unknown> | undefined)
    };
    const githubOverride = publishOverrides.github;

    if (githubOverride.enabled !== undefined) {
      githubConfig.enabled = githubOverride.enabled;
    }
    if (githubOverride.tag !== undefined) {
      githubConfig.tag = githubOverride.tag;
    }
    if (githubOverride.access !== undefined) {
      githubConfig.access = githubOverride.access;
    }
    if (githubOverride.dryRun !== undefined) {
      githubConfig.dryRun = githubOverride.dryRun;
    }
    if (githubOverride.tokenEnv !== undefined) {
      githubConfig.tokenEnv = githubOverride.tokenEnv;
    }
    if (githubOverride.registry !== undefined) {
      githubConfig.registry = githubOverride.registry;
    }
    if (githubOverride.command !== undefined) {
      githubConfig.command = githubOverride.command;
    }

    publish.github = cleanUndefined(githubConfig);
  }

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
