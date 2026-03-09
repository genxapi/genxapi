#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildApplication,
  buildChoiceParser,
  buildCommand,
  buildRouteMap,
  numberParser,
  run,
  type CommandContext,
  type StricliDynamicCommandContext,
} from "@stricli/core";
import { loadCliConfig, type CliConfig } from "./config/loader";
import {
  HTTP_CLIENT_CHOICES,
  ORVAL_CLIENT_CHOICES,
  ORVAL_MODE_CHOICES,
  type TemplateOverrides,
} from "./types";
import { runGenerateCommand } from "./commands/generate";
import { runPublishCommand } from "./commands/publish";
import { Logger, type LogLevel } from "./utils/logger";
import { redactSecrets } from "./utils/redactSecrets";

const CURRENT_VERSION = readCurrentVersion();
const LOG_LEVEL_CHOICES: readonly LogLevel[] = [
  "silent",
  "error",
  "warn",
  "info",
  "debug",
] as const;
const PACKAGE_MANAGER_CHOICES = ["npm", "pnpm", "yarn", "bun"] as const;
const NPM_COMMAND_CHOICES = PACKAGE_MANAGER_CHOICES;
const MOCK_TYPE_CHOICES = ["msw", "off"] as const;
const ACCESS_CHOICES = ["public", "restricted"] as const;
const PUBLISH_MODE_CHOICES = ["config", "off", "npm", "github", "both"] as const;

interface GenerateFlags {
  readonly config?: string;
  readonly dryRun?: boolean;
  readonly logLevel?: LogLevel;
  readonly target?: string;
  readonly outputPath?: string;
  readonly planOutput?: string;
  readonly contract?: string;
  readonly contractVersion?: string;
  readonly publishMode?: (typeof PUBLISH_MODE_CHOICES)[number];
  readonly template?: string;
  readonly httpClient?: (typeof HTTP_CLIENT_CHOICES)[number];
  readonly client?: (typeof ORVAL_CLIENT_CHOICES)[number];
  readonly mode?: (typeof ORVAL_MODE_CHOICES)[number];
  readonly baseUrl?: string;
  readonly mockType?: (typeof MOCK_TYPE_CHOICES)[number];
  readonly mockDelay?: number;
  readonly mockUseExamples?: boolean;
  readonly pkgManager?: (typeof PACKAGE_MANAGER_CHOICES)[number];
  readonly npmRegistry?: string;
  readonly npmAccess?: (typeof ACCESS_CHOICES)[number];
  readonly npmTag?: string;
  readonly npmCommand?: (typeof NPM_COMMAND_CHOICES)[number];
  readonly npmTokenEnv?: string;
  readonly npmDryRun?: boolean;
  readonly npmPublish?: boolean;
  readonly noNpmPublish?: boolean;
}

interface PublishFlags {
  readonly token: string;
  readonly owner: string;
  readonly repo: string;
  readonly tag: string;
  readonly title?: string;
  readonly body?: string;
  readonly draft?: boolean;
  readonly prerelease?: boolean;
}

type GenerateArgs = [];
type PublishArgs = [];

interface CliContext extends CommandContext {
  readonly cwd: string;
  readonly console: Console;
}

const logLevelParser = buildChoiceParser<LogLevel>(LOG_LEVEL_CHOICES);
const httpClientParser = buildChoiceParser(HTTP_CLIENT_CHOICES);
const clientParser = buildChoiceParser(ORVAL_CLIENT_CHOICES);
const modeParser = buildChoiceParser(ORVAL_MODE_CHOICES);
const mockTypeParser = buildChoiceParser(MOCK_TYPE_CHOICES);
const packageManagerParser = buildChoiceParser(PACKAGE_MANAGER_CHOICES);
const npmCommandParser = buildChoiceParser(NPM_COMMAND_CHOICES);
const accessParser = buildChoiceParser(ACCESS_CHOICES);
const publishModeParser = buildChoiceParser(PUBLISH_MODE_CHOICES);

const generateCommand = buildCommand<GenerateFlags, GenerateArgs, CliContext>({
  docs: {
    brief: "Generate API clients based on configuration",
    fullDescription:
      "Loads genxapi configuration, prepares templates, and runs generators for each configured client.",
  },
  parameters: {
    aliases: {
      c: "config",
    },
    flags: {
      config: {
        kind: "parsed",
        brief: "Path to configuration file",
        optional: true,
        parse: trimInput,
      },
      dryRun: {
        kind: "boolean",
        brief: "Validate configuration and emit a generation plan without writing files",
        optional: true,
      },
      logLevel: {
        kind: "parsed",
        brief: "Log level (silent|error|warn|info|debug)",
        optional: true,
        parse: logLevelParser,
      },
      target: {
        kind: "parsed",
        brief: "Override the project directory output",
        optional: true,
        parse: trimInput,
      },
      outputPath: {
        kind: "parsed",
        brief: "Override the generated project directory output",
        optional: true,
        parse: trimInput,
      },
      planOutput: {
        kind: "parsed",
        brief: "Write the resolved generation plan to a JSON file",
        optional: true,
        parse: trimInput,
      },
      contract: {
        kind: "parsed",
        brief: "Override the contract path or URL for single-client configs",
        optional: true,
        parse: trimInput,
      },
      contractVersion: {
        kind: "parsed",
        brief: "Attach an external contract version string to plan and manifest metadata",
        optional: true,
        parse: trimInput,
      },
      publishMode: {
        kind: "parsed",
        brief: "Override publish automation (config|off|npm|github|both)",
        optional: true,
        parse: publishModeParser,
      },
      template: {
        kind: "parsed",
        brief: "Template package or alias (e.g. orval, kubb, @genxapi/template-kubb)",
        optional: true,
        parse: trimInput,
      },
      httpClient: {
        kind: "parsed",
        brief: "Override the HTTP client implementation (axios|fetch)",
        optional: true,
        parse: httpClientParser,
      },
      client: {
        kind: "parsed",
        brief:
          "Override the generated client adapter (react-query|swr|vue-query|svelte-query|axios|angular|zod|fetch)",
        optional: true,
        parse: clientParser,
      },
      mode: {
        kind: "parsed",
        brief:
          "Override the generator output mode (single|split|split-tag|split-tags|tags|tags-split)",
        optional: true,
        parse: modeParser,
      },
      baseUrl: {
        kind: "parsed",
        brief: "Override the default base URL applied to generated clients",
        optional: true,
        parse: trimInput,
      },
      mockType: {
        kind: "parsed",
        brief: "Select mock adapter (msw|off)",
        optional: true,
        parse: mockTypeParser,
      },
      mockDelay: {
        kind: "parsed",
        brief: "Mock response delay in milliseconds",
        optional: true,
        parse: numberParser,
      },
      mockUseExamples: {
        kind: "boolean",
        brief: "Use OpenAPI examples when generating mocks",
        optional: true,
      },
      pkgManager: {
        kind: "parsed",
        brief: "Override package manager (npm|pnpm|yarn|bun)",
        optional: true,
        parse: packageManagerParser,
      },
      npmRegistry: {
        kind: "parsed",
        brief: "Override npm publish registry or preset (npm|github)",
        optional: true,
        parse: trimInput,
      },
      npmAccess: {
        kind: "parsed",
        brief: "Override npm publish access (public|restricted)",
        optional: true,
        parse: accessParser,
      },
      npmTag: {
        kind: "parsed",
        brief: "Override npm publish dist-tag",
        optional: true,
        parse: trimInput,
      },
      npmCommand: {
        kind: "parsed",
        brief: "Override npm publish command (npm|pnpm|yarn|bun)",
        optional: true,
        parse: npmCommandParser,
      },
      npmTokenEnv: {
        kind: "parsed",
        brief: "Override npm publish token environment variable",
        optional: true,
        parse: trimInput,
      },
      npmDryRun: {
        kind: "boolean",
        brief: "Publish to npm in dry-run mode",
        optional: true,
      },
      npmPublish: {
        kind: "boolean",
        brief: "Force-enable npm publish post-generation",
        optional: true,
        hidden: true,
      },
      noNpmPublish: {
        kind: "boolean",
        brief: "Disable npm publish post-generation",
        optional: true,
      },
    },
  },
  async func(flags) {
    const logger = new Logger();

    try {
      const {
        config: loadedConfig,
        configDir,
        template,
      } = await loadCliConfig({
        file: flags.config,
        template: flags.template,
      });

      let config = loadedConfig;
      logger.setLevel(config.logLevel as LogLevel);

      if (flags.logLevel) {
        logger.setLevel(flags.logLevel);
      }

      const directoryOverride = resolveProjectDirectoryOverride(flags);
      if (directoryOverride) {
        const resolvedTarget = resolve(process.cwd(), directoryOverride);
        const relativeTarget = relative(configDir, resolvedTarget) || "./";
        config = {
          ...config,
          project: {
            ...config.project,
            directory:
              relativeTarget.startsWith("./") || relativeTarget.startsWith("../")
                ? relativeTarget
                : `./${relativeTarget}`,
          },
        };
      }

      if (flags.contract) {
        config = applyContractOverride(config, flags.contract);
      }

      await runGenerateCommand({
        config,
        configDir,
        logger,
        dryRun: flags.dryRun ?? false,
        template,
        overrides: buildOverridesFromFlags(flags),
        toolVersion: CURRENT_VERSION,
        planOutputFile: flags.planOutput ? resolve(process.cwd(), flags.planOutput) : undefined,
        contractVersion: flags.contractVersion,
      });
    } catch (error) {
      logger.error(redactSecrets(error instanceof Error ? error.message : String(error)));
      process.exitCode = 1;
    }
  },
});

const publishCommand = buildCommand<PublishFlags, PublishArgs, CliContext>({
  docs: {
    brief: "Create a GitHub release using Octokit",
    fullDescription: "Creates a GitHub release for the specified repository and tag.",
  },
  parameters: {
    aliases: {
      t: "token",
      o: "owner",
      r: "repo",
      g: "tag",
    },
    flags: {
      token: {
        kind: "parsed",
        brief: "GitHub token",
        optional: false,
        parse: trimInput,
      },
      owner: {
        kind: "parsed",
        brief: "Repository owner",
        optional: false,
        parse: trimInput,
      },
      repo: {
        kind: "parsed",
        brief: "Repository name",
        optional: false,
        parse: trimInput,
      },
      tag: {
        kind: "parsed",
        brief: "Tag name",
        optional: false,
        parse: trimInput,
      },
      title: {
        kind: "parsed",
        brief: "Release title",
        optional: true,
        parse: trimInput,
      },
      body: {
        kind: "parsed",
        brief: "Release body",
        optional: true,
        parse: trimInput,
      },
      draft: {
        kind: "boolean",
        brief: "Create release as draft",
        optional: true,
      },
      prerelease: {
        kind: "boolean",
        brief: "Mark release as prerelease",
        optional: true,
      },
    },
  },
  async func(flags) {
    const logger = new Logger();

    try {
      await runPublishCommand({
        token: flags.token,
        owner: flags.owner,
        repo: flags.repo,
        tag: flags.tag,
        title: flags.title,
        body: flags.body,
        draft: flags.draft ?? false,
        prerelease: flags.prerelease ?? false,
        logger,
      });
    } catch (error) {
      logger.error(redactSecrets(error instanceof Error ? error.message : String(error)));
      process.exitCode = 1;
    }
  },
});

const rootRoutes = buildRouteMap<"generate" | "publish", CliContext>({
  routes: {
    generate: generateCommand,
    publish: publishCommand,
  },
  docs: {
    brief: "GenX API automation CLI",
  },
});

const application = buildApplication(rootRoutes, {
  name: "genxapi",
  versionInfo: {
    currentVersion: CURRENT_VERSION,
  },
  scanner: {
    caseStyle: "allow-kebab-for-camel",
  },
});

export async function runCli(argv: readonly string[] = process.argv.slice(2)) {
  const context = createDynamicContext();
  await run(application, argv, context);
}

if (isDirectInvocation()) {
  runCli().catch((error) => {
    console.error(redactSecrets(error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  });
}

export { UnifiedGeneratorConfigSchema } from "./types";
export type { UnifiedGeneratorConfig, UnifiedClientOptions, TemplateOverrides } from "./types";

function buildOverridesFromFlags(flags: GenerateFlags): TemplateOverrides | undefined {
  const overrides: TemplateOverrides = {};
  let publish = overrides.publish;

  if (flags.publishMode && flags.publishMode !== "config") {
    publish = buildPublishModeOverrides(flags.publishMode);
    overrides.publish = publish;
  }

  if (flags.httpClient) {
    overrides.httpClient = flags.httpClient;
  }

  if (flags.client) {
    overrides.client = flags.client;
  }

  if (flags.mode) {
    overrides.mode = flags.mode;
  }

  if (flags.baseUrl) {
    overrides.baseUrl = flags.baseUrl;
  }

  const mock: NonNullable<TemplateOverrides["mock"]> = {};
  let hasMockOverride = false;

  if (flags.mockType) {
    mock.type = flags.mockType;
    hasMockOverride = true;
  }

  if (typeof flags.mockDelay === "number" && !Number.isNaN(flags.mockDelay)) {
    mock.delay = flags.mockDelay;
    hasMockOverride = true;
  }

  if (flags.mockUseExamples === true) {
    mock.useExamples = true;
    hasMockOverride = true;
  }

  if (flags.pkgManager) {
    overrides.packageManager = flags.pkgManager;
  }

  type NpmOverrides = NonNullable<NonNullable<TemplateOverrides["publish"]>["npm"]>;
  const npmOverrides: NpmOverrides = {};
  let hasNpmOverride = false;

  if (flags.npmPublish === true) {
    npmOverrides.enabled = true;
    hasNpmOverride = true;
  }

  if (flags.noNpmPublish === true) {
    npmOverrides.enabled = false;
    hasNpmOverride = true;
  }

  if (flags.npmAccess) {
    npmOverrides.access = flags.npmAccess;
    hasNpmOverride = true;
  }

  if (flags.npmTag) {
    npmOverrides.tag = flags.npmTag;
    hasNpmOverride = true;
  }

  if (flags.npmCommand) {
    npmOverrides.command = flags.npmCommand;
    hasNpmOverride = true;
  }

  if (flags.npmTokenEnv) {
    npmOverrides.tokenEnv = flags.npmTokenEnv;
    hasNpmOverride = true;
  }

  if (flags.npmRegistry) {
    npmOverrides.registry = normaliseRegistryPreset(flags.npmRegistry);
    hasNpmOverride = true;
  }

  if (flags.npmDryRun === true) {
    npmOverrides.dryRun = true;
    hasNpmOverride = true;
  }

  if (hasMockOverride) {
    overrides.mock = mock;
  }

  if (hasNpmOverride) {
    overrides.publish = {
      ...(publish ?? {}),
      npm: {
        ...(publish?.npm ?? {}),
        ...npmOverrides,
      },
    };
  }

  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

function buildPublishModeOverrides(
  publishMode: NonNullable<GenerateFlags["publishMode"]>,
): NonNullable<TemplateOverrides["publish"]> {
  switch (publishMode) {
    case "off":
      return {
        npm: { enabled: false },
        github: { enabled: false },
      };
    case "npm":
      return {
        npm: { enabled: true },
        github: { enabled: false },
      };
    case "github":
      return {
        npm: { enabled: false },
        github: { enabled: true },
      };
    case "both":
      return {
        npm: { enabled: true },
        github: { enabled: true },
      };
    case "config":
    default:
      return {};
  }
}

function readCurrentVersion(): string {
  try {
    const packageJsonUrl = new URL("../package.json", import.meta.url);
    const packageJson = JSON.parse(readFileSync(packageJsonUrl, "utf8")) as { version?: unknown };
    return typeof packageJson.version === "string" ? packageJson.version : "0.0.0-development";
  } catch {
    return "0.0.0-development";
  }
}

function normaliseRegistryPreset(value: string): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "github" || lower === "gh" || lower === "github-packages") {
    return "https://npm.pkg.github.com";
  }
  if (lower === "npm" || lower === "public" || lower === "registry") {
    return "https://registry.npmjs.org/";
  }
  return trimmed;
}

function trimInput(input: string): string {
  return input.trim();
}

function resolveProjectDirectoryOverride(flags: GenerateFlags): string | undefined {
  if (!flags.target) {
    return flags.outputPath;
  }

  if (!flags.outputPath || flags.outputPath === flags.target) {
    return flags.target;
  }

  throw new Error("Use either --target or --output-path, not both.");
}

function applyContractOverride(config: CliConfig, contractSource: string): CliConfig {
  if (config.clients.length !== 1) {
    throw new Error(
      "The --contract override is only supported for single-client configs. For multi-client runs, keep contract sources in the config file.",
    );
  }

  const [firstClient] = config.clients as Array<Record<string, unknown>>;
  const updatedClient = {
    ...firstClient,
    swagger: contractSource,
    contract: {
      ...((firstClient.contract as Record<string, unknown> | undefined) ?? {}),
      source: contractSource,
    },
  };

  return {
    ...config,
    clients: [updatedClient],
  };
}

function isDirectInvocation(): boolean {
  if (!process.argv[1]) return false;
  const entryPath = resolve(process.argv[1]);
  return fileURLToPath(import.meta.url) === entryPath;
}

function createDynamicContext(): StricliDynamicCommandContext<CliContext> {
  const stdout = toWritable(process.stdout);
  const stderr = toWritable(process.stderr);

  return {
    process: {
      stdout,
      stderr,
      env: process.env,
      get exitCode() {
        return process.exitCode;
      },
      set exitCode(value) {
        process.exitCode = Number(value);
      },
    },
    locale:
      process.env.LC_ALL ??
      process.env.LC_MESSAGES ??
      process.env.LANG ??
      process.env.LANGUAGE ??
      "en-US",
    forCommand: async () => ({
      process: {
        stdout,
        stderr,
      },
      cwd: process.cwd(),
      console,
    }),
  };
}

function toWritable(stream: NodeJS.WriteStream) {
  return {
    write: (chunk: string) => stream.write(chunk),
    getColorDepth: stream.getColorDepth?.bind(stream),
  };
}
