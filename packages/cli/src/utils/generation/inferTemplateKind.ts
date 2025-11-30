import { TEMPLATE_PACKAGE_MAP } from "src/config/unified.js";
import { ClientApiTemplates } from "src/types";

export function inferTemplateKind(templateName: string): ClientApiTemplates | undefined {
  if (templateName === TEMPLATE_PACKAGE_MAP.orval) {
    return ClientApiTemplates.Orval;
  }
  if (templateName === TEMPLATE_PACKAGE_MAP.kubb) {
    return ClientApiTemplates.Kubb;
  }
  return undefined;
}
