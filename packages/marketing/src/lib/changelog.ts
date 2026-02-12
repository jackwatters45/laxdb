export type ChangelogCategory = "data" | "feature" | "improvement" | "community";

export const CATEGORY_LABELS: Record<ChangelogCategory, string> = {
  data: "Data",
  feature: "Feature",
  improvement: "Improvement",
  community: "Community",
};
