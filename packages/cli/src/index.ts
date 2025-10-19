#!/usr/bin/env node
import { resolve as resolvePath } from "node:path";
import { relative as relativePath } from "pathe";
import { Command } from "commander";
import { loadCliConfig } from "./config/loader.js";
import type { TemplateOverrides } from "./config/unified.js";
import { runGenerateCommand } from "./commands/generate.js";
import { runPublishCommand } from "./commands/publish.js";
import { Logger, type LogLevel } from "./utils/logger.js";

const program = new Command();
program
  .name("genxapi")
  .description("Automate, orchestrate, and publish SDKs — faster.")
  .version("0.1.0");

program
  .command("generate")
  .description("Generate API clients based on configuration")
  .option("-c, --config <path>", "Path to configuration file")
  .option("--dry-run", "Validate configuration without generating", false)
  .option("--log-level <level>", "Log level", "info")
  .option("--target <dir>", "Override the project directory output")
  .option(
    "--template <name>",
    "Template package or alias (e.g. orval, kubb, @genxapi/template-kubb)"
  )
  .option("--http-client <name>", "Override the HTTP client implementation (axios|fetch)")
  .option(
    "--client <name>",
    "Override the generated client adapter (react-query|swr|vue-query|svelte-query|axios|angular|zod|fetch)"
  )
  .option(
    "--mode <mode>",
    "Override the generator output mode (single|split|split-tag|split-tags|tags|tags-split)"
  )
  .option("--base-url <url>", "Override the default base URL applied to generated clients")
  .option("--mock-type <type>", "Select mock adapter (msw|off)")
  .option(
    "--mock-delay <ms>",
    "Mock response delay in milliseconds",
    (value: string) => Number.parseInt(value, 10)
  )
  .option("--mock-use-examples", "Use OpenAPI examples when generating mocks")
  .action(async function (this: Command, options) {
    const logger = new Logger();
    try {
      const { config: loadedConfig, configDir, template } = await loadCliConfig({
        file: options.config,
        template: options.template
      });
      let config = loadedConfig;
      logger.setLevel(config.logLevel as LogLevel);

      const source = this.getOptionValueSource("logLevel");
      if (source === "cli") {
        logger.setLevel(options.logLevel as LogLevel);
      }

      if (options.target) {
        const resolvedTarget = resolvePath(process.cwd(), options.target);
        const relativeTarget = relativePath(configDir, resolvedTarget) || "./";
        config = {
          ...config,
          project: {
            ...config.project,
            directory: relativeTarget.startsWith("./") || relativeTarget.startsWith("../")
              ? relativeTarget
              : `./${relativeTarget}`
          }
        };
      }

      await runGenerateCommand({
        config,
        configDir,
        logger,
        dryRun: options.dryRun,
        template,
        overrides: buildOverridesFromOptions(options)
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command("publish")
  .description("Create a GitHub release using Octokit")
  .requiredOption("-t, --token <token>", "GitHub token")
  .requiredOption("-o, --owner <owner>", "Repository owner")
  .requiredOption("-r, --repo <repo>", "Repository name")
  .requiredOption("-g, --tag <tag>", "Tag name")
  .option("--title <title>", "Release title")
  .option("--body <body>", "Release body")
  .option("--draft", "Create release as draft", false)
  .option("--prerelease", "Mark release as prerelease", false)
  .action(async (options) => {
    const logger = new Logger();
    try {
      await runPublishCommand({
        token: options.token,
        owner: options.owner,
        repo: options.repo,
        tag: options.tag,
        title: options.title,
        body: options.body,
        draft: options.draft,
        prerelease: options.prerelease,
        logger
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);

export { UnifiedGeneratorConfigSchema } from "./config/unified.js";
export type { UnifiedGeneratorConfig, UnifiedClientOptions, TemplateOverrides } from "./config/unified.js";

function buildOverridesFromOptions(options: Record<string, any>): TemplateOverrides | undefined {
  const overrides: TemplateOverrides = {};

  if (typeof options.httpClient === "string" && options.httpClient.length > 0) {
    overrides.httpClient = options.httpClient;
  }

  if (typeof options.client === "string" && options.client.length > 0) {
    overrides.client = options.client;
  }

  if (typeof options.mode === "string" && options.mode.length > 0) {
    overrides.mode = options.mode;
  }

  if (typeof options.baseUrl === "string" && options.baseUrl.length > 0) {
    overrides.baseUrl = options.baseUrl;
  }

  const mock: NonNullable<TemplateOverrides["mock"]> = {};
  let hasMockOverride = false;

  if (typeof options.mockType === "string" && options.mockType.length > 0) {
    mock.type = options.mockType;
    hasMockOverride = true;
  }

  if (typeof options.mockDelay === "number" && !Number.isNaN(options.mockDelay)) {
    mock.delay = options.mockDelay;
    hasMockOverride = true;
  }

  if (options.mockUseExamples === true) {
    mock.useExamples = true;
    hasMockOverride = true;
  }

  if (hasMockOverride) {
    overrides.mock = mock;
  }

  return Object.keys(overrides).length > 0 ? overrides : undefined;
}
