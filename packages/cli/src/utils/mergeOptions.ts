import merge from "merge-deep";

/**
 * Deep merges option objects, skipping undefined entries.
 *
 * @param options - Option objects to merge.
 * @returns A new object containing merged values.
 */
export function mergeOptions<T>(...options: Array<T | undefined>): T {
  return merge({}, ...options.filter(Boolean)) as T;
}
