import type { Drill } from "@/types";

/**
 * Map a DB drill (from api-v2 RPC) to the frontend Drill type.
 * Field renames: publicId→id, category→categories, positionGroup→positionGroups
 */
export function mapDrill(db: {
  publicId: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  difficulty: string;
  category: readonly string[];
  positionGroup: readonly string[];
  intensity: string | null;
  contact: boolean | null;
  competitive: boolean | null;
  playerCount: number | null;
  durationMinutes: number | null;
  fieldSpace: string | null;
  equipment: readonly string[] | null;
  tags: readonly string[];
}): Drill {
  return {
    id: db.publicId,
    name: db.name,
    subtitle: db.subtitle,
    description: db.description,
    difficulty: db.difficulty as Drill["difficulty"],
    categories: [...db.category] as Drill["categories"],
    positionGroups: [...db.positionGroup] as Drill["positionGroups"],
    intensity: db.intensity as Drill["intensity"],
    contact: db.contact ?? false,
    competitive: db.competitive ?? false,
    playerCount: db.playerCount,
    durationMinutes: db.durationMinutes,
    fieldSpace: db.fieldSpace as Drill["fieldSpace"],
    equipment: db.equipment ? [...db.equipment] : [],
    tags: [...db.tags],
  };
}
