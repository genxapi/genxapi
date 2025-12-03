import type { Logger } from "../../utils/logger";

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

export interface SyncOptions {
  readonly projectDir: string;
  readonly repository: RepositoryConfig;
  readonly logger: Logger;
}
