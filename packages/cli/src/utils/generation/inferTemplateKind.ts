import { TEMPLATE_PACKAGE_MAP } from "src/config/unified.js";
import { ClientApiTemplates } from "src/types";

/**
 * Normalises a template package name into the corresponding ClientApiTemplates enum value.
 *
 * @param templateName - Template package name (e.g. "@genxapi/template-orval" or "@genxapi/template-kubb").
 * @returns The matching ClientApiTemplates value, or undefined when the name does not match a built-in template.
 */
export function inferTemplateKind(templateName: string): ClientApiTemplates | undefined {
  if (templateName === TEMPLATE_PACKAGE_MAP.orval) {
    return ClientApiTemplates.Orval;
  }
  if (templateName === TEMPLATE_PACKAGE_MAP.kubb) {
    return ClientApiTemplates.Kubb;
  }
  return undefined;
}
