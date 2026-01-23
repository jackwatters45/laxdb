/**
 * Convert label to URL-safe slug
 * Used by content-collections and graph-utils to ensure consistent slug generation
 */
export function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, "") // Remove special chars like : ? /
    .replaceAll(/\s+/g, "-")
    .replaceAll(/--+/g, "-"); // Collapse multiple dashes
}
