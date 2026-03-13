/** Drill difficulty levels */
export type Difficulty = "beginner" | "intermediate" | "advanced";

/** Drill categories */
export type DrillCategory =
  | "passing"
  | "shooting"
  | "defense"
  | "ground-balls"
  | "face-offs"
  | "clearing"
  | "riding"
  | "transition"
  | "man-up"
  | "man-down"
  | "conditioning";

/** Position groups */
export type PositionGroup =
  | "attack"
  | "midfield"
  | "defense"
  | "goalie"
  | "all";

/** Intensity levels */
export type Intensity = "low" | "medium" | "high";

/** Field space requirements */
export type FieldSpace = "full-field" | "half-field" | "box";

/** A drill template that can be added to a practice */
export interface Drill {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  difficulty: Difficulty;
  categories: DrillCategory[];
  positionGroups: PositionGroup[];
  intensity: Intensity | null;
  contact: boolean;
  competitive: boolean;
  playerCount: number | null;
  durationMinutes: number | null;
  fieldSpace: FieldSpace | null;
  equipment: string[];
  tags: string[];
}

/** Practice item types */
export type PracticeItemType =
  | "warmup"
  | "drill"
  | "cooldown"
  | "water-break"
  | "activity";

/** Priority levels for practice items */
export type PracticeItemPriority = "required" | "optional" | "if-time";

/** Practice status */
export type PracticeStatus =
  | "draft"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";

/** A node in the practice workflow */
export interface PracticeNode {
  id: string;
  type: PracticeItemType;
  drillId: string | null;
  label: string;
  durationMinutes: number | null;
  notes: string | null;
  groups: string[];
  priority: PracticeItemPriority;
  position: { x: number; y: number };
}

/** An edge connecting two practice nodes */
export interface PracticeEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/** A complete practice plan */
export interface Practice {
  id: string;
  name: string;
  date: string | null;
  description: string | null;
  notes: string | null;
  durationMinutes: number | null;
  location: string | null;
  status: PracticeStatus;
  nodes: PracticeNode[];
  edges: PracticeEdge[];
}
