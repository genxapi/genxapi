#!/usr/bin/env node
import { Command } from "commander";
import { loadCliConfig } from "./config/loader.js";
import { runGenerateCommand } from "./commands/generate.js";
import { runPublishCommand } from "./commands/publish.js";
import { Logger, type LogLevel } from "./utils/logger.js";

const program = new Command();
program
  .name("generate-api-client")
  .description("Generate multiple API clients from Orval templates")
  .version("0.1.0");

program
  .command("generate")
  .description("Generate API clients based on configuration")
  .option("-c, --config <path>", "Path to configuration file")
  .option("--dry-run", "Validate configuration without generating", false)
  .option("--log-level <level>", "Log level", "info")
  .action(async function (this: Command, options) {
    const logger = new Logger();
    try {
      const { config, configDir } = await loadCliConfig({ file: options.config });
      logger.setLevel(config.logLevel as LogLevel);

      const source = this.getOptionValueSource("logLevel");
      if (source === "cli") {
        logger.setLevel(options.logLevel as LogLevel);
      }

      await runGenerateCommand({
        config,
        configDir,
        logger,
        dryRun: options.dryRun
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
