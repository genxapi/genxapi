import z from "zod";
import { TemplateIdentifierSchema, TemplateOptionsSchema } from "./templates";

export const HTTP_CLIENT_CHOICES = ["axios", "fetch"] as const;
const HttpClientSchema = z.enum(HTTP_CLIENT_CHOICES);

export const ORVAL_CLIENT_CHOICES = [
  "axios",
  "axios-functions",
  "angular",
  "react-query",
  "swr",
  "vue-query",
  "svelte-query",
  "zod",
  "fetch"
] as const;
const OrvalClientAdapterSchema = z.enum(ORVAL_CLIENT_CHOICES);

export const ORVAL_MODE_CHOICES = [
  "single",
  "split",
  "tags",
  "split-tags",
  "split-tag",
  "tags-split"
] as const;
export const OrvalModeSchema = z.enum(ORVAL_MODE_CHOICES);

export const MockOptionsObjectSchema = z
  .object({
    type: z.enum(["msw", "off"]).default("msw"),
    delay: z.number().int().nonnegative().optional(),
    useExamples: z.boolean().optional()
  })
  .partial();

export const MockOptionsSchema = z.union([z.boolean(), MockOptionsObjectSchema]);

export const PluginOptionsSchema = z
  .object({
    client: z.record(z.string(), z.unknown()).optional(),
    ts: z.record(z.string(), z.unknown()).optional(),
    oas: z.record(z.string(), z.unknown()).optional()
  })
  .partial();

export const CONTRACT_CHECKSUM_ALGORITHMS = ["sha256", "sha512"] as const;
export const ContractChecksumAlgorithmSchema = z.enum(CONTRACT_CHECKSUM_ALGORITHMS);

export const ContractChecksumSchema = z.union([
  z.boolean(),
  z
    .object({
      algorithm: ContractChecksumAlgorithmSchema.optional()
    })
    .partial()
]);

export const ContractSnapshotSchema = z.union([
  z.boolean(),
  z
    .object({
      path: z.string().optional()
    })
    .partial()
]);

export const ContractAuthSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("bearer"),
    tokenEnv: z.string().min(1),
    scheme: z.string().min(1).optional()
  }),
  z.object({
    type: z.literal("basic"),
    usernameEnv: z.string().min(1),
    passwordEnv: z.string().min(1)
  }),
  z.object({
    type: z.literal("header"),
    headerName: z.string().min(1),
    valueEnv: z.string().min(1),
    prefix: z.string().min(1).optional()
  })
]);

export const ContractConfigSchema = z
  .object({
    source: z.string().min(1),
    auth: ContractAuthSchema.optional(),
    checksum: ContractChecksumSchema.optional(),
    snapshot: ContractSnapshotSchema.optional()
  })
  .partial()
  .refine((value) => typeof value.source === "string" && value.source.length > 0, {
    message: "Contract source is required."
  });

export const UnifiedClientOptionsSchema = z
  .object({
    httpClient: HttpClientSchema.optional(),
    client: OrvalClientAdapterSchema.optional(),
    mode: OrvalModeSchema.optional(),
    baseUrl: z.string().optional(),
    mock: MockOptionsSchema.optional(),
    prettier: z.boolean().optional(),
    clean: z.boolean().optional(),
    plugins: PluginOptionsSchema.optional(),
    kubb: PluginOptionsSchema.optional()
  })
  .partial()
  .passthrough();

export const UnifiedClientOutputSchema = z
  .object({
    workspace: z.string().optional(),
    target: z.string().optional(),
    schemas: z.string().optional()
  })
  .default({});

export type UnifiedClientOutputInput = z.input<typeof UnifiedClientOutputSchema>;

export const UnifiedClientSchema = z
  .object({
    name: z.string().min(1),
    swagger: z.string().min(1).optional(),
    contract: ContractConfigSchema.optional(),
    output: UnifiedClientOutputSchema.optional(),
    config: UnifiedClientOptionsSchema.optional(),
    template: TemplateIdentifierSchema.optional()
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (!value.swagger && !value.contract?.source) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each client must define either `swagger` or `contract.source`.",
        path: ["swagger"]
      });
    }
  });

export const UnifiedProjectSchema = z
  .object({
    name: z.string().min(1),
    directory: z.string().min(1).default("./"),
    packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm"),
    template: TemplateIdentifierSchema.default("orval"),
    templateOptions: TemplateOptionsSchema,
    output: z.string().optional(),
    config: UnifiedClientOptionsSchema.default({}),
    repository: z.unknown().optional(),
    publish: z.unknown().optional(),
    readme: z.unknown().optional(),
    runGenerate: z.boolean().optional()
  })
  .passthrough();

export const UnifiedHooksSchema = z
  .object({
    beforeGenerate: z.array(z.string()).default([]),
    afterGenerate: z.array(z.string()).default([])
  })
  .default({});

export const UnifiedGeneratorConfigSchema = z
  .object({
    $schema: z.string().optional(),
    logLevel: z.enum(["silent", "error", "warn", "info", "debug"]).optional(),
    project: UnifiedProjectSchema,
    clients: z.array(UnifiedClientSchema).min(1),
    hooks: UnifiedHooksSchema
  })
  .passthrough();

export type UnifiedGeneratorConfig = z.infer<typeof UnifiedGeneratorConfigSchema>;
export type UnifiedClientOptions = z.infer<typeof UnifiedClientOptionsSchema>;
export type HttpClientValue = z.infer<typeof HttpClientSchema>;
export type OrvalClientAdapterValue = z.infer<typeof OrvalClientAdapterSchema>;
export type OrvalModeValue = z.infer<typeof OrvalModeSchema>;
export type ContractConfig = z.infer<typeof ContractConfigSchema>;
export type ContractAuthConfig = z.infer<typeof ContractAuthSchema>;
export type ContractChecksumConfig = z.infer<typeof ContractChecksumSchema>;
export type ContractSnapshotConfig = z.infer<typeof ContractSnapshotSchema>;
export type ContractChecksumAlgorithm = z.infer<typeof ContractChecksumAlgorithmSchema>;
