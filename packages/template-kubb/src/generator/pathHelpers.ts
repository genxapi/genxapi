export function ensureRelativePath(value: string): string {
  const normalised = value.replace(/\\/g, "/");
  if (
    normalised.startsWith("./") ||
    normalised.startsWith("../") ||
    normalised.startsWith("/") ||
    normalised.startsWith("file:")
  ) {
    return normalised;
  }
  return `./${normalised}`;
}

export function joinRelative(base: string, segment: string): string {
  const trimmedBase = ensureRelativePath(base).replace(/\/+$/, "");
  const trimmedSegment = segment.replace(/\\/g, "/").replace(/^(\.\/)+/, "").replace(/^\/+/, "");
  if (!trimmedSegment) {
    return trimmedBase;
  }
  return ensureRelativePath(`${trimmedBase}/${trimmedSegment}`);
}
