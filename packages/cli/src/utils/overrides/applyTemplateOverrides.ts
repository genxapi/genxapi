import { CliConfig } from "src/config/loader";
import { ClientApiTemplates, TemplateOverrides } from "src/types";
import { applyKubbOverrides } from "./applyKubbOverrides";
import { applyOrvalOverrides } from "./applyOrvalOverrides";
import { applyProjectOverrides } from "./applyProjectOverrides";
import { Mutable } from "./types";

/**
 * Applies CLI/template overrides to a config and returns a new config instance.
 *
 * @param inputConfig - Parsed CLI config.
 * @param templateKind - Template identifier to target overrides.
 * @param overrides - Override values.
 * @returns New config with overrides applied.
 */
export function applyTemplateOverrides(
  inputConfig: CliConfig,
  templateKind: ClientApiTemplates | undefined,
  overrides: TemplateOverrides | undefined
): CliConfig {
  const config = structuredClone(inputConfig) as Mutable<CliConfig>;
  if (!overrides) {
    return config;
  }

  const resolvedTemplateKind = templateKind ?? config.project.template;

  applyProjectOverrides(config.project as Mutable<CliConfig["project"]>, overrides);

  if (resolvedTemplateKind === ClientApiTemplates.Orval) {
    config.clients = applyOrvalOverrides(
      config.clients as any,
      overrides
    ) as Mutable<CliConfig["clients"]>;
  }

  if (resolvedTemplateKind === ClientApiTemplates.Kubb) {
    config.clients = applyKubbOverrides(
      config.clients as any,
      overrides
    ) as Mutable<CliConfig["clients"]>;
  }

  return config;
}
