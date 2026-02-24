import { execa } from "execa";
import type { ExecaError } from "execa";
import { redactSecrets } from "../../../utils/redactSecrets";

export interface RunGitOptions {
  readonly ignoreFailure?: boolean;
  readonly redactValues?: Array<string | undefined>;
}

/**
 * Runs a git command in the provided working directory.
 *
 * @param args - Git arguments (e.g. ["status"]).
 * @param cwd - Working directory to run git in.
 * @param optionsOrIgnoreFailure - When true, swallows failures and returns an empty string.
 *   When an options object, controls failure handling and secret redaction.
 * @returns The stdout produced by git.
 * @throws Error with enriched context when git exits non-zero and ignoreFailure is false.
 */
export async function runGit(args: string[], cwd: string, ignoreFailure?: boolean): Promise<string>;
export async function runGit(args: string[], cwd: string, options?: RunGitOptions): Promise<string>;
export async function runGit(
  args: string[],
  cwd: string,
  optionsOrIgnoreFailure: RunGitOptions | boolean = {}
): Promise<string> {
  const { ignoreFailure = false, redactValues = [] } =
    typeof optionsOrIgnoreFailure === "boolean"
      ? { ignoreFailure: optionsOrIgnoreFailure }
      : optionsOrIgnoreFailure;
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
    throw new Error(buildGitErrorMessage(args, cwd, error, redactValues));
  }
}

/**
 * Builds a helpful git error message including exit info and captured output.
 */
function buildGitErrorMessage(
  args: string[],
  cwd: string,
  error: unknown,
  redactValues: Array<string | undefined>
): string {
  const command = redactSecrets(`git ${args.join(" ")}`, { secrets: redactValues });
  const base = `Failed to run "${command}" in ${cwd}.`;
  if (isExecaError(error)) {
    const segments: string[] = [];
    if (typeof error.exitCode === "number") {
      segments.push(`exit code ${error.exitCode}`);
    }
    if (typeof error.signal === "string") {
      segments.push(`signal ${error.signal}`);
    }
    const stderr =
      typeof error.stderr === "string"
        ? error.stderr.trim()
        : error.stderr !== undefined && error.stderr !== null
          ? error.stderr.toString().trim()
          : undefined;
    const stdout =
      typeof error.stdout === "string"
        ? error.stdout.trim()
        : error.stdout !== undefined && error.stdout !== null
          ? error.stdout.toString().trim()
          : undefined;
    const detail = segments.length > 0 ? ` (${segments.join(", ")})` : "";
    const stderrBlock = stderr
      ? `\nGit stderr:\n${redactSecrets(stderr, { secrets: redactValues })}`
      : "";
    const stdoutBlock = stdout
      ? `\nGit stdout:\n${redactSecrets(stdout, { secrets: redactValues })}`
      : "";
    return `${base}${detail}${stderrBlock}${stdoutBlock}\nRefer to the troubleshooting guide for common fixes.`;
  }
  if (error instanceof Error) {
    return `${base}\n${redactSecrets(error.message, { secrets: redactValues })}\nRefer to the troubleshooting guide for common fixes.`;
  }
  return `${base}\n${redactSecrets(String(error), { secrets: redactValues })}\nRefer to the troubleshooting guide for common fixes.`;
}

/**
 * Type guard for ExecaError.
 */
function isExecaError(error: unknown): error is ExecaError {
  return (
    typeof error === "object" &&
    error !== null &&
    "exitCode" in error &&
    "stderr" in error
  );
}
