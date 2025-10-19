import { existsSync } from "node:fs";
import { join } from "node:path";
import { Octokit } from "octokit";
import { execa } from "execa";
import type { ExecaError } from "execa";
import type { Logger } from "../utils/logger.js";

export interface PullRequestConfig {
  readonly enabled: boolean;
  readonly title: string;
  readonly body: string;
  readonly branchPrefix: string;
}

export interface RepositoryConfig {
  readonly owner: string;
  readonly name: string;
  readonly defaultBranch?: string;
  readonly create?: boolean;
  readonly commitMessage: string;
  readonly pullRequest: PullRequestConfig;
  readonly tokenEnv?: string;
}

interface SyncOptions {
  readonly projectDir: string;
  readonly repository: RepositoryConfig;
  readonly logger: Logger;
}

export async function synchronizeRepository(options: SyncOptions): Promise<void> {
  const { repository, projectDir, logger } = options;
  const tokenEnv = repository.tokenEnv ?? "GITHUB_TOKEN";
  const token = process.env[tokenEnv];

  if (!token) {
    logger.warn(`Skipping GitHub sync: environment variable ${tokenEnv} is not set.`);
    return;
  }

  const octokit = new Octokit({ auth: token });
  const owner = repository.owner;
  const repo = repository.name;

  const repoData = await ensureRepository(octokit, repository, logger);
  await ensureGitInitialization(projectDir, repository, logger);

  const defaultBranch = repository.defaultBranch ?? repoData?.data.default_branch ?? "main";
  const repoHasBaseBranch =
    repoData && (await hasBranch(octokit, owner, repo, defaultBranch));

  if (repoHasBaseBranch) {
    await synchronizeWithPullRequest({
      octokit,
      owner,
      repo,
      projectDir,
      repository,
      token,
      defaultBranch,
      logger
    });
  } else {
    await pushInitialCommit({
      projectDir,
      repository,
      token,
      defaultBranch,
      owner,
      repo,
      logger
    });
  }
}

async function ensureRepository(
  octokit: Octokit,
  repository: RepositoryConfig,
  logger: Logger
) {
  const { owner, name, create } = repository;
  try {
    return await octokit.rest.repos.get({ owner, repo: name });
  } catch (error) {
    if (isNotFound(error)) {
      if (!create) {
        logger.warn(`Repository ${owner}/${name} does not exist and creation is disabled.`);
        throw new Error(`Repository ${owner}/${name} not found.`);
      }
      const authenticated = await octokit.rest.users.getAuthenticated();
      const authenticatedLogin = authenticated.data.login;
      if (authenticatedLogin?.toLowerCase() === owner.toLowerCase()) {
        logger.info(`Creating GitHub repository ${owner}/${name}`);
        return await octokit.rest.repos.createForAuthenticatedUser({
          name,
          private: false
        });
      }
      logger.info(`Creating GitHub repository ${owner}/${name} under organisation ${owner}`);
      return await octokit.rest.repos.createInOrg({
        org: owner,
        name
      });
    }
    throw error;
  }
}

async function pushInitialCommit({
  projectDir,
  repository,
  token,
  defaultBranch,
  owner,
  repo,
  logger
}: {
  projectDir: string;
  repository: RepositoryConfig;
  token: string;
  defaultBranch: string;
  owner: string;
  repo: string;
  logger: Logger;
}) {
  await configureGitRemote(projectDir, owner, repo, logger);
  await ensureGitUser(projectDir);
  const hasExistingCommits = await repositoryHasCommits(projectDir);
  if (hasExistingCommits) {
    await runGit(["checkout", "-B", defaultBranch], projectDir);
  } else {
    await runGit(["checkout", "--orphan", defaultBranch], projectDir);
  }
  const hasChanges = await commitAll(projectDir, repository.commitMessage, logger);
  if (!hasChanges) {
    logger.info("No changes detected for initial push. Skipping GitHub synchronization.");
    return;
  }
  await pushBranch(projectDir, defaultBranch, token, owner, repo, logger);
  logger.info(`Pushed initial commit to ${owner}/${repo}@${defaultBranch}.`);
}

async function synchronizeWithPullRequest({
  octokit,
  owner,
  repo,
  projectDir,
  repository,
  token,
  defaultBranch,
  logger
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  projectDir: string;
  repository: RepositoryConfig;
  token: string;
  defaultBranch: string;
  logger: Logger;
}) {
  await configureGitRemote(projectDir, owner, repo, logger);
  await ensureGitUser(projectDir);

  await fetchBranch(projectDir, token, owner, repo, defaultBranch);

  let needsExplicitCheckout = await hasLocalBranch(projectDir, defaultBranch);
  if (!needsExplicitCheckout) {
    const checkedOutFromRemote = await checkoutFromRemote(projectDir, defaultBranch);
    if (!checkedOutFromRemote) {
      await runGit(["checkout", "-b", defaultBranch], projectDir);
    }
  }

  if (needsExplicitCheckout) {
    await runGit(["checkout", defaultBranch], projectDir);
  }

  const branchName = buildBranchName(repository.pullRequest);
  await runGit(["checkout", "-B", branchName], projectDir);

  const hasChanges = await commitAll(projectDir, repository.commitMessage, logger);
  if (!hasChanges) {
    logger.info("No changes detected. Skipping GitHub pull request creation.");
    return;
  }

  await pushBranch(projectDir, branchName, token, owner, repo, logger);

  if (!repository.pullRequest.enabled) {
    logger.info("Pull request creation disabled. Changes pushed to remote branch.");
    return;
  }

  const existing = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "open",
    head: `${owner}:${branchName}`
  });

  if (existing.data.length > 0) {
    logger.info(
      `Pull request for branch ${branchName} already exists (#${existing.data[0].number}).`
    );
    return;
  }

  const pr = await octokit.rest.pulls.create({
    owner,
    repo,
    base: defaultBranch,
    head: branchName,
    title: repository.pullRequest.title,
    body: repository.pullRequest.body
  });

  logger.info(`Opened pull request #${pr.data.number} for ${owner}/${repo}.`);
}

async function hasBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> {
  try {
    await octokit.rest.repos.getBranch({ owner, repo, branch });
    return true;
  } catch (error) {
    if (isNotFound(error)) {
      return false;
    }
    throw error;
  }
}

async function ensureGitInitialization(
  projectDir: string,
  repository: RepositoryConfig,
  logger: Logger
): Promise<void> {
  if (!existsSync(join(projectDir, ".git"))) {
    logger.info("Initializing git repository.");
    await runGit(["init"], projectDir);
  }
}

async function configureGitRemote(
  projectDir: string,
  owner: string,
  repo: string,
  logger: Logger
): Promise<void> {
  const remoteUrl = `https://github.com/${owner}/${repo}.git`;
  try {
    await runGit(["remote", "set-url", "origin", remoteUrl], projectDir);
  } catch {
    await runGit(["remote", "add", "origin", remoteUrl], projectDir);
  }
  logger.debug?.("Configured git remote.");
}

async function pushBranch(
  projectDir: string,
  branch: string,
  token: string,
  owner: string,
  repo: string,
  logger: Logger
): Promise<void> {
  const remoteName = "origin";
  const cleanUrl = await getRemoteUrl(projectDir, remoteName);
  const authUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

  // Temporarily set remote with credentials for push
  try {
    await runGit(["remote", "set-url", remoteName, authUrl], projectDir);
    await runGit(["push", "--set-upstream", remoteName, branch], projectDir);
  } finally {
    if (cleanUrl) {
      await runGit(["remote", "set-url", remoteName, cleanUrl], projectDir, true);
    }
  }

  logger.info(`Pushed branch ${branch} to ${owner}/${repo}.`);
}

async function commitAll(
  projectDir: string,
  message: string,
  logger: Logger
): Promise<boolean> {
  await runGit(["add", "--all"], projectDir);
  const status = await getStatus(projectDir);
  if (!status) {
    return false;
  }
  await runGit(["commit", "-m", message], projectDir);
  logger.info("Committed generated artifacts.");
  return true;
}

async function ensureGitUser(projectDir: string): Promise<void> {
  if (!(await hasGitConfig(projectDir, "user.email"))) {
    await runGit(["config", "user.email", "bot@api-client-generator.local"], projectDir);
  }
  if (!(await hasGitConfig(projectDir, "user.name"))) {
    await runGit(["config", "user.name", "API Client Generator"], projectDir);
  }
}

async function hasGitConfig(projectDir: string, key: string): Promise<boolean> {
  try {
    await runGit(["config", "--get", key], projectDir);
    return true;
  } catch {
    return false;
  }
}

async function hasLocalBranch(projectDir: string, branch: string): Promise<boolean> {
  try {
    await runGit(["rev-parse", "--verify", branch], projectDir);
    return true;
  } catch {
    return false;
  }
}

async function getStatus(projectDir: string): Promise<string> {
  const result = await runGit(["status", "--porcelain"], projectDir);
  return result.trim();
}

function buildBranchName(config: PullRequestConfig): string {
  const prefix = config.branchPrefix || "update/generated-client";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}/${timestamp}`;
}

async function fetchBranch(
  projectDir: string,
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<void> {
  const authUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
  await runGit(["fetch", authUrl, branch], projectDir, true);
}

async function getRemoteUrl(projectDir: string, name: string): Promise<string | null> {
  try {
    const result = await runGit(["remote", "get-url", name], projectDir);
    return result.trim();
  } catch {
    return null;
  }
}

async function checkoutFromRemote(projectDir: string, branch: string): Promise<boolean> {
  try {
    await runGit(["checkout", "-b", branch, `origin/${branch}`], projectDir);
    return true;
  } catch {
    return false;
  }
}

async function repositoryHasCommits(projectDir: string): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--verify", "HEAD"], {
      cwd: projectDir,
      stdio: "pipe"
    });
    return true;
  } catch {
    return false;
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && (error as any).status === 404;
}

async function runGit(args: string[], cwd: string, ignoreFailure = false): Promise<string> {
  try {
    const result = await execa("git", args, {
      cwd,
      stdio: "pipe"
    });
    return result.stdout;
  } catch (error) {
    if (ignoreFailure) {
      return "";
    }
    throw new Error(buildGitErrorMessage(args, cwd, error));
  }
}

function buildGitErrorMessage(
  args: string[],
  cwd: string,
  error: unknown
): string {
  const command = `git ${args.join(" ")}`;
  const base = `Failed to run "${command}" in ${cwd}.`;
  if (isExecaError(error)) {
    const segments: string[] = [];
    if (typeof error.exitCode === "number") {
      segments.push(`exit code ${error.exitCode}`);
    }
    if (typeof error.signal === "string") {
      segments.push(`signal ${error.signal}`);
    }
    const stderr = error.stderr?.trim();
    const stdout = error.stdout?.trim();
    const detail = segments.length > 0 ? ` (${segments.join(", ")})` : "";
    const stderrBlock = stderr ? `\nGit stderr:\n${stderr}` : "";
    const stdoutBlock = stdout ? `\nGit stdout:\n${stdout}` : "";
    return `${base}${detail}${stderrBlock}${stdoutBlock}\nRefer to the troubleshooting guide for common fixes.`;
  }
  if (error instanceof Error) {
    return `${base}\n${error.message}\nRefer to the troubleshooting guide for common fixes.`;
  }
  return `${base}\n${String(error)}\nRefer to the troubleshooting guide for common fixes.`;
}

function isExecaError(error: unknown): error is ExecaError {
  return (
    typeof error === "object" &&
    error !== null &&
    "exitCode" in error &&
    "stderr" in error
  );
}
