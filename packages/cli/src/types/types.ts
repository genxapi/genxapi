import z from "zod";

export enum ClientApiTemplates {
  Orval = "orval",
  Kubb = "kubb"
};

const TemplateIdentifierSchema = z.union([z.literal(ClientApiTemplates.Orval), z.literal(ClientApiTemplates.Kubb), z.string()]);

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
    swagger: z.string().min(1),
    output: UnifiedClientOutputSchema.optional(),
    config: UnifiedClientOptionsSchema.optional(),
    template: TemplateIdentifierSchema.optional()
  })
  .passthrough();

export const TemplateOptionsSchema = z
  .object({
    variables: z.record(z.string(), z.string()).optional(),
    installDependencies: z.boolean().optional(),
    path: z.string().optional()
  })
  .default({});

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

export interface TemplateOverrides {
  httpClient?: HttpClientValue;
  client?: OrvalClientAdapterValue;
  mode?: OrvalModeValue;
  baseUrl?: string;
  prettier?: boolean;
  clean?: boolean;
  packageManager?: "npm" | "pnpm" | "yarn" | "bun";
  publish?: {
    npm?: {
      enabled?: boolean;
      tag?: string;
      access?: "public" | "restricted";
      dryRun?: boolean;
      tokenEnv?: string;
      registry?: string;
      command?: "npm" | "pnpm" | "yarn" | "bun";
    };
  };
  mock?: {
    type?: string | null;
    delay?: number | null;
    useExamples?: boolean | null;
    enabled?: boolean;
  };
}