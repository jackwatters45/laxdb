import type {
  Difficulty,
  DrillCategory,
  FieldSpace,
  Intensity,
  PositionGroup,
} from "@/types";

export const DRILL_CATEGORY_OPTIONS = [
  { value: "passing", label: "Passing" },
  { value: "shooting", label: "Shooting" },
  { value: "defense", label: "Defense" },
  { value: "ground-balls", label: "Ground Balls" },
  { value: "face-offs", label: "Face-offs" },
  { value: "clearing", label: "Clearing" },
  { value: "riding", label: "Riding" },
  { value: "transition", label: "Transition" },
  { value: "man-up", label: "Man-Up" },
  { value: "man-down", label: "Man-Down" },
  { value: "conditioning", label: "Conditioning" },
] as const satisfies ReadonlyArray<{ value: DrillCategory; label: string }>;

export const DRILL_LIST_CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...DRILL_CATEGORY_OPTIONS,
] as const;

export type DrillListCategoryFilter =
  (typeof DRILL_LIST_CATEGORY_FILTER_OPTIONS)[number]["value"];

export const DRILL_LIBRARY_CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "warmup", label: "Warm-ups", tag: "warmup" },
  { value: "passing", label: "Passing" },
  { value: "shooting", label: "Shooting" },
  { value: "defense", label: "Defense" },
  { value: "ground-balls", label: "Ground Balls" },
  { value: "face-offs", label: "Face-offs" },
  { value: "transition", label: "Transition" },
  { value: "man-up", label: "Man-Up" },
  { value: "conditioning", label: "Conditioning" },
  { value: "cooldown", label: "Cool-downs", tag: "cooldown" },
] as const;

export type DrillLibraryCategoryFilter =
  (typeof DRILL_LIBRARY_CATEGORY_FILTER_OPTIONS)[number]["value"];

export const POSITION_GROUP_OPTIONS = [
  { value: "attack", label: "Attack" },
  { value: "midfield", label: "Midfield" },
  { value: "defense", label: "Defense" },
  { value: "goalie", label: "Goalie" },
  { value: "all", label: "All" },
] as const satisfies ReadonlyArray<{ value: PositionGroup; label: string }>;

export const DRILL_DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const satisfies ReadonlyArray<{ value: Difficulty; label: string }>;

export const DRILL_DIFFICULTY_FILTER_OPTIONS = [
  { value: "all", label: "All Levels" },
  ...DRILL_DIFFICULTY_OPTIONS,
] as const;

export type DrillDifficultyFilter =
  (typeof DRILL_DIFFICULTY_FILTER_OPTIONS)[number]["value"];

export const DRILL_INTENSITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const satisfies ReadonlyArray<{ value: Intensity; label: string }>;

export const DRILL_FIELD_SPACE_OPTIONS = [
  { value: "full-field", label: "Full Field" },
  { value: "half-field", label: "Half Field" },
  { value: "box", label: "Box" },
] as const satisfies ReadonlyArray<{ value: FieldSpace; label: string }>;

export const DRILL_DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "bg-green-500/10 text-green-600",
  intermediate: "bg-amber-500/10 text-amber-600",
  advanced: "bg-red-500/10 text-red-600",
};
