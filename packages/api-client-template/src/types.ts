import { z } from "zod";

export const ClientConfigSchema = z.object({
  name: z.string().min(1),
  swagger: z.string().min(1),
  output: z.object({
    workspace: z.string().default("./src"),
    target: z.string().default("./src/client.ts"),
    schemas: z.string().default("model")
  }),
  templateVariables: z.record(z.string(), z.string()).default({}),
  orval: z
    .object({
      mode: z.string().default("split"),
      client: z.string().default("react-query"),
      baseUrl: z.string().default("http://localhost:3000"),
      mock: z.boolean().default(true),
      prettier: z.boolean().default(true),
      clean: z.boolean().default(true)
    })
    .default({}),
  copySwagger: z.boolean().default(true),
  swaggerCopyTarget: z.string().default("swagger-spec.json")
});

export const ProjectConfigSchema = z.object({
  name: z.string().min(1),
  directory: z.string().min(1),
  packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm"),
  template: z
    .object({
      name: z.string().default("@eduardoac/api-client-template"),
      path: z.string().optional(),
      variables: z.record(z.string(), z.string()).default({}),
      installDependencies: z.boolean().default(true)
    })
    .default({}),
  runGenerate: z.boolean().default(true)
});

export const MultiClientConfigSchema = z.object({
  project: ProjectConfigSchema,
  clients: z.array(ClientConfigSchema).min(1),
  hooks: z
    .object({
      beforeGenerate: z.array(z.string()).default([]),
      afterGenerate: z.array(z.string()).default([])
    })
    .default({})
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type MultiClientConfig = z.infer<typeof MultiClientConfigSchema>;

export interface GenerateClientsOptions {
  readonly runOrval?: boolean;
  readonly logger?: {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    debug?(message: string): void;
  };
  readonly configDir?: string;
}
