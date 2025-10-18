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

const PullRequestConfigSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().default("chore: update generated client"),
  body: z
    .string()
    .default(
      "This pull request was generated automatically and updates the Orval-powered API client."
    ),
  branchPrefix: z.string().default("update/generated-client")
});

const RepositoryConfigSchema = z.object({
  provider: z.literal("github").default("github"),
  owner: z.string().min(1),
  name: z.string().min(1),
  defaultBranch: z.string().default("main"),
  create: z.boolean().default(true),
  commitMessage: z.string().default("chore: update generated client"),
  pullRequest: PullRequestConfigSchema.default({}),
  tokenEnv: z.string().default("GITHUB_TOKEN")
});

const NpmPublishConfigSchema = z.object({
  enabled: z.boolean().default(false),
  tag: z.string().default("latest"),
  access: z.enum(["public", "restricted"]).default("public"),
  dryRun: z.boolean().default(false),
  tokenEnv: z.string().default("NPM_TOKEN"),
  registry: z.string().optional(),
  command: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm")
});

const ReadmeSectionSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1)
});

const ProjectReadmeSchema = z
  .object({
    introduction: z.string().optional(),
    usage: z.string().optional(),
    additionalSections: z.array(ReadmeSectionSchema).default([])
  })
  .default({});

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
  runGenerate: z.boolean().default(true),
  repository: RepositoryConfigSchema.optional(),
  publish: z
    .object({
      npm: NpmPublishConfigSchema.default({})
    })
    .default({}),
  readme: ProjectReadmeSchema.optional()
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
export type RepositoryConfig = z.infer<typeof RepositoryConfigSchema>;
export type PullRequestConfig = z.infer<typeof PullRequestConfigSchema>;
export type NpmPublishConfig = z.infer<typeof NpmPublishConfigSchema>;
export type ProjectReadmeConfig = z.infer<typeof ProjectReadmeSchema>;
export type ReadmeSection = z.infer<typeof ReadmeSectionSchema>;

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
