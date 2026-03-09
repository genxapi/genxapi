import z from "zod";

export enum ClientApiTemplates {
  Orval = "orval",
  Kubb = "kubb"
}

export const BuiltinTemplateReferenceSchema = z
  .object({
    provider: z.literal("builtin"),
    name: z.string().min(1)
  })
  .strict();

export const ExternalTemplateReferenceSchema = z
  .object({
    provider: z.literal("external"),
    module: z.string().min(1),
    export: z.string().min(1).default("genxTemplate")
  })
  .strict();

export const TemplateIdentifierSchema = z.union([
  z.literal(ClientApiTemplates.Orval),
  z.literal(ClientApiTemplates.Kubb),
  z.string(),
  BuiltinTemplateReferenceSchema,
  ExternalTemplateReferenceSchema
]);

export const TemplateOptionsSchema = z
  .object({
    variables: z.record(z.string(), z.string()).optional(),
    installDependencies: z.boolean().optional(),
    path: z.string().optional()
  })
  .default({});

export type TemplateOptions = z.infer<typeof TemplateOptionsSchema>;
export type BuiltinTemplateReference = z.infer<typeof BuiltinTemplateReferenceSchema>;
export type ExternalTemplateReference = z.infer<typeof ExternalTemplateReferenceSchema>;
export type TemplateIdentifier = z.infer<typeof TemplateIdentifierSchema>;

export function isBuiltinTemplateReference(value: unknown): value is BuiltinTemplateReference {
  return BuiltinTemplateReferenceSchema.safeParse(value).success;
}

export function isExternalTemplateReference(value: unknown): value is ExternalTemplateReference {
  return ExternalTemplateReferenceSchema.safeParse(value).success;
}
