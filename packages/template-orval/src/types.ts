import { z } from "zod";

const MockConfigSchema = z
  .union([
    z.boolean(),
    z
      .object({
        type: z.string().default("msw"),
        delay: z.number().int().nonnegative().optional(),
        useExamples: z.boolean().optional()
      })
      .partial()
  ]);

const ContractChecksumAlgorithmSchema = z.enum(["sha256", "sha512"]);

const ContractChecksumSchema = z.union([
  z.boolean(),
  z
    .object({
      algorithm: ContractChecksumAlgorithmSchema.optional()
    })
    .partial()
]);

const ContractSnapshotSchema = z.union([
  z.boolean(),
  z
    .object({
      path: z.string().optional()
    })
    .partial()
]);

const ContractAuthSchema = z.discriminatedUnion("type", [
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

const ContractConfigSchema = z
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

export const ClientConfigSchema = z
  .object({
    name: z.string().min(1),
    swagger: z.string().min(1).optional(),
    contract: ContractConfigSchema.optional(),
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
        httpClient: z.string().optional(),
        baseUrl: z.string().default("http://localhost:3000"),
        mock: MockConfigSchema.optional().default(true),
        prettier: z.boolean().default(true),
        clean: z.boolean().default(true)
      })
      .default({}),
    copySwagger: z.boolean().default(true),
    swaggerCopyTarget: z.string().default("swagger-spec.json")
  })
  .superRefine((value, ctx) => {
    if (!value.swagger && !value.contract?.source) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each client must define either `swagger` or `contract.source`.",
        path: ["swagger"]
      });
    }
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
  access: z.enum(["public", "restricted"]).default("restricted"),
  dryRun: z.boolean().default(false),
  tokenEnv: z.string().default("NPM_TOKEN"),
  registry: z.string().optional(),
  command: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm")
});

const GithubPublishConfigSchema = NpmPublishConfigSchema.extend({
  access: z.enum(["public", "restricted"]).default("restricted"),
  tokenEnv: z.string().default("GITHUB_TOKEN"),
  registry: z.string().default("https://npm.pkg.github.com")
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
      name: z.string().default("@genxapi/template-orval"),
      path: z.string().optional(),
      variables: z.record(z.string(), z.string()).default({}),
      installDependencies: z.boolean().default(true)
    })
    .default({}),
  runGenerate: z.boolean().default(true),
  repository: RepositoryConfigSchema.optional(),
  publish: z
    .object({
      npm: NpmPublishConfigSchema.default({}),
      github: GithubPublishConfigSchema.default({})
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
export type GithubPublishConfig = z.infer<typeof GithubPublishConfigSchema>;
export type ProjectReadmeConfig = z.infer<typeof ProjectReadmeSchema>;
export type ReadmeSection = z.infer<typeof ReadmeSectionSchema>;

export interface TemplatePlannedDependency {
  readonly name: string;
  readonly section: "dependencies" | "devDependencies" | "peerDependencies" | "optionalDependencies";
  readonly reason: string;
}

export interface TemplateDocumentationHint {
  readonly title: string;
  readonly body: string;
}

export interface TemplateOutputMetadata {
  readonly configFiles?: readonly string[];
  readonly entrypoints?: readonly string[];
  readonly notes?: readonly string[];
}

export interface TemplatePlan {
  readonly selectedCapabilities: readonly string[];
  readonly dependencies: readonly TemplatePlannedDependency[];
  readonly documentationHints?: readonly TemplateDocumentationHint[];
  readonly output?: TemplateOutputMetadata;
}

export interface GenerateClientsOptions {
  readonly runOrval?: boolean;
  readonly logger?: {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    debug?(message: string): void;
  };
  readonly configDir?: string;
  readonly toolVersion?: string;
  readonly generatedAt?: string;
  readonly templatePlan?: TemplatePlan;
  readonly resolvedContracts?: Record<
    string,
    {
      readonly source: string;
      readonly type: "local" | "remote";
      readonly resolvedSource: string;
      readonly generatorInput: string;
      readonly snapshot: {
        readonly enabled: boolean;
        readonly path?: string;
      };
      readonly checksum?: {
        readonly algorithm: "sha256" | "sha512";
        readonly value: string;
      };
      readonly metadata: Record<string, unknown>;
      readonly info: {
        readonly title?: string;
        readonly description?: string;
        readonly version?: string;
        readonly source: string;
      } | null;
    }
  >;
}
