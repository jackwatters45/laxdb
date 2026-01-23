/**
 * Format a date string for display in blog/wiki content
 */
export function formatPublishedDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
