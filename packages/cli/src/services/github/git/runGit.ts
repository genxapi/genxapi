import { execa } from "execa";
import type { ExecaError } from "execa";

/**
 * Runs a git command in the provided working directory.
 *
 * @param args - Git arguments (e.g. ["status"]).
 * @param cwd - Working directory to run git in.
 * @param ignoreFailure - When true, swallows failures and returns an empty string.
 * @returns The stdout produced by git.
 * @throws Error with enriched context when git exits non-zero and ignoreFailure is false.
 */
export async function runGit(args: string[], cwd: string, ignoreFailure = false): Promise<string> {
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

/**
 * Builds a helpful git error message including exit info and captured output.
 */
function buildGitErrorMessage(args: string[], cwd: string, error: unknown): string {
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
    const stderrBlock = stderr ? `\nGit stderr:\n${stderr}` : "";
    const stdoutBlock = stdout ? `\nGit stdout:\n${stdout}` : "";
    return `${base}${detail}${stderrBlock}${stdoutBlock}\nRefer to the troubleshooting guide for common fixes.`;
  }
  if (error instanceof Error) {
    return `${base}\n${error.message}\nRefer to the troubleshooting guide for common fixes.`;
  }
  return `${base}\n${String(error)}\nRefer to the troubleshooting guide for common fixes.`;
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
