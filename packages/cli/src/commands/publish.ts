import { Octokit } from "octokit";
import ora from "ora";
import type { Logger } from "../utils/logger";

export interface PublishCommandOptions {
  readonly token: string;
  readonly owner: string;
  readonly repo: string;
  readonly tag: string;
  readonly title?: string;
  readonly body?: string;
  readonly draft?: boolean;
  readonly prerelease?: boolean;
  readonly logger: Logger;
}

export async function runPublishCommand(options: PublishCommandOptions): Promise<void> {
  const spinner = ora("Creating GitHub release").start();
  try {
    const octokit = new Octokit({ auth: options.token });
    await octokit.rest.repos.createRelease({
      owner: options.owner,
      repo: options.repo,
      tag_name: options.tag,
      name: options.title ?? options.tag,
      body: options.body,
      draft: options.draft ?? false,
      prerelease: options.prerelease ?? false
    });
    spinner.succeed("Release created successfully");
  } catch (error) {
    spinner.fail("Failed to create release");
    throw error;
  }
}
