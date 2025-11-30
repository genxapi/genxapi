import { TemplateOverrides, UnifiedClientOptions } from "src/types";

/**
 * Resolves the effective mock configuration combining base options and CLI overrides.
 *
 * @param mockOptions - Mock options from config.
 * @param overrides - Override values from CLI/template overrides.
 * @returns False when disabled, a mock options object when enabled, or undefined when not set.
 */
export function normaliseMockValue(
  mockOptions: UnifiedClientOptions["mock"],
  overrides?: TemplateOverrides["mock"]
): boolean | Record<string, unknown> | undefined {
  if (!mockOptions && !overrides) {
    return undefined;
  }

  const override = overrides ?? {};
  const hasOverrideDetails =
    override.type !== undefined ||
    override.delay !== undefined ||
    override.useExamples !== undefined ||
    override.enabled !== undefined;

  if (mockOptions === false && !hasOverrideDetails) {
    return false;
  }

  const source =
    typeof mockOptions === "boolean" ? {} : (mockOptions as Record<string, unknown> | undefined) ?? {};

  const type = override.type ?? (source as Record<string, unknown>).type ?? "msw";
  const enabled =
    override.enabled !== undefined
      ? override.enabled
      : type !== "off" && type !== "false" && mockOptions !== false;

  if (!enabled) {
    return false;
  }

  const merged: Record<string, unknown> = {};
  merged.type = type === "off" || type === "false" ? "msw" : type;
  const delay = override.delay ?? source.delay;
  if (typeof delay === "number") {
    merged.delay = delay;
  }
  const useExamples = override.useExamples ?? source.useExamples;
  if (typeof useExamples === "boolean") {
    merged.useExamples = useExamples;
  }

  return merged;
}
