import { TEMPLATE_PACKAGE_MAP, resolveTemplatePackage } from "src/utils/templatePackages";

const DEFAULT_TEMPLATE = TEMPLATE_PACKAGE_MAP.orval;

export function resolveTemplateAlias(name: string): string {
  return resolveTemplatePackage(name);
}

export function inferTemplateFromConfig(rawConfig: unknown): string {
  if (typeof rawConfig !== "object" || rawConfig === null) {
    return DEFAULT_TEMPLATE;
  }

  const project = (rawConfig as Record<string, unknown>).project;
  if (typeof project !== "object" || project === null) {
    return DEFAULT_TEMPLATE;
  }

  const template = (project as Record<string, unknown>).template;
  if (typeof template === "string") {
    return resolveTemplateAlias(template);
  }

  return DEFAULT_TEMPLATE;
}

export { DEFAULT_TEMPLATE };
