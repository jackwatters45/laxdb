import type { Drill, PracticeNode, PracticeEdge, DrillCategory } from "@/types";

function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

interface QuickPlanOptions {
  durationMinutes: number;
  categories: DrillCategory[];
  includeWarmup: boolean;
  includeCooldown: boolean;
}

interface QuickPlanResult {
  nodes: PracticeNode[];
  edges: PracticeEdge[];
}

/**
 * Generates a practice plan by selecting drills from the mock library
 * and arranging them in a standard flow:
 *   Start -> Warm-up -> Drills -> Water Break -> More Drills -> Cool-down
 */
export function generateQuickPlan(
  drills: readonly Drill[],
  options: QuickPlanOptions,
): QuickPlanResult {
  const { durationMinutes, categories, includeWarmup, includeCooldown } =
    options;

  const nodes: PracticeNode[] = [];
  const edges: PracticeEdge[] = [];
  let y = 0;
  const yStep = 140;
  let remainingMinutes = durationMinutes;

  // Start node
  const startNode: PracticeNode = {
    id: nextId("node"),
    type: "activity",
    variant: "start",
    drillId: null,
    label: "Start",
    durationMinutes: null,
    notes: null,
    groups: ["all"],
    priority: "required",
    position: { x: 0, y },
  };
  nodes.push(startNode);
  y += yStep;

  // Warm-up
  if (includeWarmup) {
    const warmupDrills = drills.filter((d) => d.tags.includes("warmup"));

    for (const drill of warmupDrills) {
      if (remainingMinutes <= 0) break;
      const dur = drill.durationMinutes ?? 8;
      const node: PracticeNode = {
        id: nextId("node"),
        type: "warmup",
        variant: "default",
        drillId: drill.publicId,
        label: drill.name,
        durationMinutes: dur,
        notes: drill.subtitle,
        groups: ["all"],
        priority: "required",
        position: { x: 0, y },
      };
      nodes.push(node);
      remainingMinutes -= dur;
      y += yStep;
    }
  }

  // Main drills from selected categories
  const matchingDrills = drills.filter(
    (d) =>
      d.category.some((c) => categories.includes(c)) &&
      !d.tags.includes("warmup") &&
      !d.tags.includes("cooldown"),
  );

  // Shuffle and pick drills that fit
  const shuffled = [...matchingDrills].toSorted(() => Math.random() - 0.5);
  let drillCount = 0;

  for (const drill of shuffled) {
    if (remainingMinutes <= (includeCooldown ? 15 : 0)) break;
    const dur = drill.durationMinutes ?? 10;
    if (dur > remainingMinutes - (includeCooldown ? 15 : 0)) continue;

    const node: PracticeNode = {
      id: nextId("node"),
      type: "drill",
      variant: "default",
      drillId: drill.publicId,
      label: drill.name,
      durationMinutes: dur,
      notes: drill.subtitle,
      groups: ["all"],
      priority: drillCount < 3 ? "required" : "optional",
      position: { x: 0, y },
    };
    nodes.push(node);
    remainingMinutes -= dur;
    drillCount++;
    y += yStep;

    // Insert water break after every 3 drills
    if (drillCount % 3 === 0 && remainingMinutes > (includeCooldown ? 20 : 5)) {
      const water: PracticeNode = {
        id: nextId("node"),
        type: "water-break",
        variant: "default",
        drillId: null,
        label: "Water Break",
        durationMinutes: 5,
        notes: null,
        groups: ["all"],
        priority: "required",
        position: { x: 0, y },
      };
      nodes.push(water);
      remainingMinutes -= 5;
      y += yStep;
    }
  }

  // Cooldown
  if (includeCooldown) {
    const cooldown = drills.find((d) => d.tags.includes("cooldown"));
    if (cooldown) {
      const node: PracticeNode = {
        id: nextId("node"),
        type: "cooldown",
        variant: "default",
        drillId: cooldown.publicId,
        label: cooldown.name,
        durationMinutes: cooldown.durationMinutes ?? 10,
        notes: cooldown.subtitle,
        groups: ["all"],
        priority: "required",
        position: { x: 0, y },
      };
      nodes.push(node);
    }
  }

  // Wire edges: linear chain
  for (let i = 0; i < nodes.length - 1; i++) {
    const source = nodes[i];
    const target = nodes[i + 1];
    if (!source || !target) continue;
    edges.push({
      id: nextId("edge"),
      source: source.id,
      target: target.id,
    });
  }

  return { nodes, edges };
}
