export const TEMPLATE_PACKAGE_MAP: Record<string, string> = {
  orval: "@genxapi/template-orval",
  kubb: "@genxapi/template-kubb"
};

/**
 * Resolves a template selector (alias or full package) to a package name.
 *
 * @param selector - Template alias or package name.
 * @returns Resolved package name.
 */
export function resolveTemplatePackage(selector: string): string {
  const normalised = selector.trim().toLowerCase();
  return TEMPLATE_PACKAGE_MAP[normalised] ?? selector;
}
