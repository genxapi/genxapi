/**
 * Determines whether an Octokit error represents a 404.
 *
 * @param error - Error thrown by Octokit.
 * @returns True when the response status is 404.
 */
export function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as any).status === 404
  );
}
