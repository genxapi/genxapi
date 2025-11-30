import z from "zod";
import { cleanUndefined } from "./cleanUndefined";
import { TemplateOptionsSchema } from "src/types";

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
