/**
 * Maps between DB types (flat ordered items) and frontend types (graph with nodes + edges).
 *
 * DB → Frontend: items sorted by orderIndex become nodes; edges derived from order.
 * Frontend → DB: nodes topologically sorted to produce orderIndex; positions persisted.
 */
import type {
  Practice as DbPractice,
  PracticeItem as DbItem,
} from "@laxdb/core-v2/practice/practice.schema";

import type {
  Practice,
  PracticeNode,
  PracticeEdge,
  PracticeNodeVariant,
  PracticeItemType,
  PracticeItemPriority,
} from "@/data/types";
import { autoLayout } from "@/lib/layout";

// ---------------------------------------------------------------------------
// DB → Frontend
// ---------------------------------------------------------------------------

/** Reconstruct a frontend Practice from DB practice + items */
export function fromDb(
  dbPractice: typeof DbPractice.Type,
  dbItems: readonly (typeof DbItem.Type)[],
): Practice {
  const sorted = [...dbItems].toSorted((a, b) => a.orderIndex - b.orderIndex);

  // Build nodes
  const nodes: PracticeNode[] = sorted.map((item) => ({
    id: item.publicId,
    type: item.type as PracticeItemType,
    variant: (item.variant ?? "default") as PracticeNodeVariant,
    drillId: item.drillPublicId,
    label: item.label ?? "",
    durationMinutes: item.durationMinutes,
    notes: item.notes,
    groups: [...item.groups],
    priority: item.priority as PracticeItemPriority,
    position: {
      x: item.positionX ?? 0,
      y: item.positionY ?? 0,
    },
  }));

  // Derive edges from order (item[0] → item[1] → item[2] ...)
  const edges: PracticeEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const source = nodes[i]!;
    const target = nodes[i + 1]!;
    edges.push({
      id: `edge-${source.id}-${target.id}`,
      source: source.id,
      target: target.id,
    });
  }

  // Auto-layout if positions are all zeros (fresh from DB with no positions)
  const allZero = nodes.every((n) => n.position.x === 0 && n.position.y === 0);
  const finalNodes =
    allZero && nodes.length > 0 ? autoLayout(nodes, edges).nodes : nodes;

  return {
    id: dbPractice.publicId,
    name: dbPractice.name ?? "Untitled Practice",
    date: dbPractice.date?.toISOString().split("T")[0] ?? null,
    description: dbPractice.description,
    notes: dbPractice.notes,
    durationMinutes: dbPractice.durationMinutes,
    location: dbPractice.location,
    status: dbPractice.status,
    nodes: finalNodes,
    edges,
  };
}

// ---------------------------------------------------------------------------
// Frontend → DB (for saving)
// ---------------------------------------------------------------------------

/** Extract practice metadata for update */
export function toPracticeUpdate(practice: Practice) {
  return {
    publicId: practice.id,
    name: practice.name,
    date: practice.date ? new Date(practice.date) : null,
    description: practice.description,
    notes: practice.notes,
    durationMinutes: practice.durationMinutes,
    location: practice.location,
    status: practice.status,
  };
}

/** Convert frontend nodes to DB item inputs, preserving order from edges */
export function toItemInputs(practice: Practice) {
  // Topological sort via edges to get order
  const ordered = topologicalSort(practice.nodes, practice.edges);

  return ordered.map((node, index) => ({
    publicId: node.id,
    practicePublicId: practice.id,
    type: node.type,
    variant: node.variant === "start" ? ("default" as const) : node.variant,
    drillPublicId: node.drillId,
    label: node.label,
    durationMinutes: node.durationMinutes,
    notes: node.notes,
    groups: node.groups,
    orderIndex: index,
    positionX: Math.round(node.position.x),
    positionY: Math.round(node.position.y),
    priority: node.priority,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function topologicalSort(
  nodes: PracticeNode[],
  edges: PracticeEdge[],
): PracticeNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    children.set(node.id, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    children.get(edge.source)?.push(edge.target);
  }

  const queue = nodes
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .map((n) => n.id);
  const result: PracticeNode[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) result.push(node);

    for (const childId of children.get(id) ?? []) {
      const deg = (inDegree.get(childId) ?? 1) - 1;
      inDegree.set(childId, deg);
      if (deg === 0) queue.push(childId);
    }
  }

  // Append any orphans not reached
  for (const node of nodes) {
    if (!result.includes(node)) result.push(node);
  }

  return result;
}
