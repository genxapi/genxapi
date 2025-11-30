import { TemplateOptions } from "src/types";

export function extractTemplateOptions(template: unknown): TemplateOptions {
  if (typeof template !== "object" || template === null) {
    return {};
  }

  const tpl = template as Record<string, unknown>;
  const variables = tpl.variables;
  return {
    path: typeof tpl.path === "string" ? tpl.path : undefined,
    installDependencies: typeof tpl.installDependencies === "boolean" ? tpl.installDependencies : undefined,
    variables:
      variables && typeof variables === "object" && !Array.isArray(variables)
        ? (variables as Record<string, string>)
        : undefined
  };
}
