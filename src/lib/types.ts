import { z } from "zod";

export const PackageManagerSchema = z.enum(["npm", "pnpm", "yarn", "bun"]);

export type PackageManager = z.infer<typeof PackageManagerSchema>;

const OrvalOptionsSchema = z
  .object({
    configPath: z.string().default("orval.config.ts"),
    workspace: z.string().default("./src/"),
    targetFile: z.string().default("./dogs.ts"),
    mode: z.string().default("tags-split"),
    client: z.string().default("react-query"),
    baseUrl: z.string().default("http://localhost:3000"),
    mock: z.boolean().default(true),
    prettier: z.boolean().default(true),
    command: z.string().default("generate"),
    postGenerateScript: z.string().optional(),
  })
  .strict();

export type OrvalOptions = z.infer<typeof OrvalOptionsSchema>;

export const GeneratorConfigSchema = z
  .object({
    template: z.string().default("client-api"),
    targetDirectory: z.string().min(1, "targetDirectory is required"),
    projectName: z.string().optional(),
    packageManager: PackageManagerSchema.default("npm"),
    swaggerPath: z.string().min(1, "swaggerPath is required"),
    copySwagger: z.boolean().default(true),
    swaggerCopyTarget: z.string().default("swagger-spec.json"),
    installDependencies: z.boolean().default(true),
    runGenerate: z.boolean().default(true),
    force: z.boolean().default(false),
    orval: OrvalOptionsSchema.default({}),
    templateVariables: z.record(z.string(), z.string()).default({}),
  })
  .strict();

export type GeneratorConfig = z.infer<typeof GeneratorConfigSchema>;

export interface ResolvedGeneratorConfig extends GeneratorConfig {
  readonly configPath?: string;
  readonly configDir: string;
  readonly targetDirectory: string;
  readonly swaggerPath: string;
  readonly swaggerIsRemote: boolean;
  readonly swaggerCopyPath: string;
  readonly packageName: string;
  readonly orval: OrvalOptions & {
    readonly configAbsolute: string;
    readonly workspaceAbsolute: string;
    readonly targetFileAbsolute: string;
  };
}
