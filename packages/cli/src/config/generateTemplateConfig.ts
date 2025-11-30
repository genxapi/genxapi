import { buildOrvalConfig, type OrvalMultiClientConfig } from "src/build/buildOrvalConfig";
import { buildKubbConfig, type KubbMultiClientConfig } from "src/build/buildKubbConfig";
import { ClientApiTemplates, UnifiedGeneratorConfig } from "src/types";
import { TEMPLATE_PACKAGE_MAP } from "../utils/templatePackages";

/**
 * Converts a unified config into the concrete template config for the selected template package.
 *
 * @param unified - Parsed unified configuration.
 * @param templatePackage - Resolved template package name.
 * @returns Concrete template config and template identifier.
 */
export function generateTemplateConfig(
  unified: UnifiedGeneratorConfig,
  templatePackage: string
): {
  readonly config: OrvalMultiClientConfig | KubbMultiClientConfig;
  readonly template: ClientApiTemplates;
} {
  if (templatePackage === TEMPLATE_PACKAGE_MAP.orval) {
    return {
      config: buildOrvalConfig(unified, templatePackage),
      template: ClientApiTemplates.Orval
    };
  }
  if (templatePackage === TEMPLATE_PACKAGE_MAP.kubb) {
    return {
      config: buildKubbConfig(unified, templatePackage),
      template: ClientApiTemplates.Kubb
    };
  }

  throw new Error(
    `Unified configuration only supports the built-in templates (${Object.values(
      TEMPLATE_PACKAGE_MAP
    ).join(", ")}). Received: ${templatePackage}.`
  );
}
