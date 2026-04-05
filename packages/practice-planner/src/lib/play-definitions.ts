import type { PlayCategory } from "@/types";

export const PLAY_CATEGORY_OPTIONS = [
  { value: "offense", label: "Offense" },
  { value: "defense", label: "Defense" },
  { value: "clear", label: "Clear" },
  { value: "ride", label: "Ride" },
  { value: "faceoff", label: "Face-off" },
  { value: "emo", label: "EMO" },
  { value: "man-down", label: "Man-Down" },
  { value: "transition", label: "Transition" },
] as const satisfies ReadonlyArray<{ value: PlayCategory; label: string }>;

export const PLAY_CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...PLAY_CATEGORY_OPTIONS,
] as const;

export type PlayCategoryFilter =
  (typeof PLAY_CATEGORY_FILTER_OPTIONS)[number]["value"];

export const PLAY_CATEGORY_COLORS: Record<PlayCategory, string> = {
  offense: "bg-blue-500/10 text-blue-600",
  defense: "bg-red-500/10 text-red-600",
  clear: "bg-teal-500/10 text-teal-600",
  ride: "bg-orange-500/10 text-orange-600",
  faceoff: "bg-purple-500/10 text-purple-600",
  emo: "bg-green-500/10 text-green-600",
  "man-down": "bg-amber-500/10 text-amber-600",
  transition: "bg-cyan-500/10 text-cyan-600",
};
