import type {
  Difficulty as DifficultySchema,
  Category as CategorySchema,
  PositionGroup as PositionGroupSchema,
  Intensity as IntensitySchema,
  FieldSpace as FieldSpaceSchema,
  Drill as DbDrill,
} from "@laxdb/core-v2/drill/drill.schema";
import type {
  PlayCategory as PlayCategorySchema,
  Play as DbPlay,
} from "@laxdb/core-v2/play/play.schema";
import type {
  PracticeItemType as PracticeItemTypeSchema,
  PracticeItemPriority as PracticeItemPrioritySchema,
  PracticeStatus as PracticeStatusSchema,
} from "@laxdb/core-v2/practice/practice.schema";
/**
 * Frontend types for the practice planner.
 *
 * Scalar types (Difficulty, Category, etc.) are derived from core-v2 schemas
 * to stay in sync with the DB. Domain types (Drill, PracticeGraph) are defined
 * here for the canvas editor's graph model.
 */
import type { Schema } from "effect";

// ---------------------------------------------------------------------------
// Scalar types — derived from core-v2 schemas
// ---------------------------------------------------------------------------

export type Difficulty = Schema.Schema.Type<typeof DifficultySchema>;
export type DrillCategory = Schema.Schema.Type<typeof CategorySchema>;
export type PositionGroup = Schema.Schema.Type<typeof PositionGroupSchema>;
export type Intensity = Schema.Schema.Type<typeof IntensitySchema>;
export type FieldSpace = Schema.Schema.Type<typeof FieldSpaceSchema>;
export type PracticeItemType = Schema.Schema.Type<
  typeof PracticeItemTypeSchema
>;
export type PracticeItemPriority = Schema.Schema.Type<
  typeof PracticeItemPrioritySchema
>;
export type PracticeStatus = Schema.Schema.Type<typeof PracticeStatusSchema>;

// ---------------------------------------------------------------------------
// Drill — mirrors DB Drill without timestamps (frontend doesn't need them)
// ---------------------------------------------------------------------------

export type Drill = Omit<typeof DbDrill.Type, "createdAt" | "updatedAt">;

// ---------------------------------------------------------------------------
// Play — mirrors DB Play without timestamps (frontend doesn't need them)
// ---------------------------------------------------------------------------

export type PlayCategory = Schema.Schema.Type<typeof PlayCategorySchema>;
export type Play = Omit<typeof DbPlay.Type, "createdAt" | "updatedAt">;

// ---------------------------------------------------------------------------
// Practice graph — canvas editor model (NOT the DB Practice)
// ---------------------------------------------------------------------------

/** Visual variant for special node rendering */
export type PracticeNodeVariant = "start" | "split" | "default";

/** A node in the practice workflow */
export interface PracticeNode {
  id: string;
  type: PracticeItemType;
  variant: PracticeNodeVariant;
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

/** A complete practice plan (canvas graph model) */
export interface PracticeGraph {
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
