import type { Drill, PracticeItemType } from "@/types";

/** Infer the practice item type from a drill's tags */
export function drillToType(drill: Drill): PracticeItemType {
  if (drill.tags.includes("warmup")) return "warmup";
  if (drill.tags.includes("cooldown")) return "cooldown";
  return "drill";
}
