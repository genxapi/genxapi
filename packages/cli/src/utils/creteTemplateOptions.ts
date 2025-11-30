import z from "zod";
import { cleanUndefined } from "./cleanUndefined";
import { TemplateOptionsSchema } from "src/types";

/**
 * Builds template metadata for generators from a package name and user-provided options.
 *
 * @param templatePackage - Resolved template package name.
 * @param options - Template options from unified config.
 * @returns Normalised template options object.
 */
export function createTemplateOptions(
  templatePackage: string,
  options: z.infer<typeof TemplateOptionsSchema>
) {
  const variables = options.variables ?? {};
  return cleanUndefined({
    name: templatePackage,
    installDependencies: options.installDependencies ?? true,
    path: options.path,
    variables
  });
}
