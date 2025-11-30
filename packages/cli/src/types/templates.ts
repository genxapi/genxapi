import z from "zod";

export enum ClientApiTemplates {
  Orval = "orval",
  Kubb = "kubb"
}

export const TemplateIdentifierSchema = z.union([
  z.literal(ClientApiTemplates.Orval),
  z.literal(ClientApiTemplates.Kubb),
  z.string()
]);

export const TemplateOptionsSchema = z
  .object({
    variables: z.record(z.string(), z.string()).optional(),
    installDependencies: z.boolean().optional(),
    path: z.string().optional()
  })
  .default({});

export type TemplateOptions = z.infer<typeof TemplateOptionsSchema>;
