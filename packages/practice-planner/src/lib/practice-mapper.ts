/**
 * Maps between DB types (flat persisted items + explicit edges) and frontend
 * types (graph with nodes + edges).
 *
 * DB → Frontend: items become nodes; persisted edges define graph topology.
 * For older rows with no persisted edges yet, fall back to linear order.
 * Frontend → DB: start nodes are UI-only and excluded from persistence.
 */
import type {
  Practice as DbPractice,
  PracticeEdge as DbPracticeEdge,
  PracticeItem as DbItem,
} from "@laxdb/core/practice/practice.schema";

import { autoLayout } from "@/lib/layout";
import type { PracticeGraph, PracticeNode, PracticeEdge } from "@/types";

interface PersistedPracticeGraph {
  nodes: PracticeNode[];
  edges: PracticeEdge[];
}

/** Reconstruct a frontend PracticeGraph from DB practice + items + edges. */
export function fromDb(
  dbPractice: typeof DbPractice.Type,
  dbItems: readonly (typeof DbItem.Type)[],
  dbEdges: readonly (typeof DbPracticeEdge.Type)[],
): PracticeGraph {
  const sortedItems = [...dbItems].toSorted(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  const nodes: PracticeNode[] = sortedItems.map((item) => ({
    id: item.publicId,
    type: item.type,
    variant: item.variant,
    drillId: item.drillPublicId,
    label: item.label ?? "",
    durationMinutes: item.durationMinutes,
    notes: item.notes,
    groups: [...item.groups],
    priority: item.priority,
    position: {
      x: item.positionX ?? 0,
      y: item.positionY ?? 0,
    },
  }));

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges =
    dbEdges.length > 0
      ? dbEdges
          .filter(
            (edge) =>
              nodeIds.has(edge.sourcePublicId) &&
              nodeIds.has(edge.targetPublicId),
          )
          .map((edge) => ({
            id: edge.publicId,
            source: edge.sourcePublicId,
            target: edge.targetPublicId,
            ...(edge.label !== null ? { label: edge.label } : {}),
          }))
      : deriveLinearEdges(nodes);

  const allZero = nodes.every(
    (node) => node.position.x === 0 && node.position.y === 0,
  );
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

/** Strip UI-only nodes/edges before persistence. */
export function toPersistedGraph(
  practice: PracticeGraph,
): PersistedPracticeGraph {
  const nodes = practice.nodes.filter((node) => node.variant !== "start");
  const persistedIds = new Set(nodes.map((node) => node.id));
  const edges = practice.edges.filter(
    (edge) => persistedIds.has(edge.source) && persistedIds.has(edge.target),
  );

  return { nodes, edges };
}

/** Order nodes by graph flow so orderIndex stays stable across reloads. */
export function orderNodesByFlow(
  nodes: readonly PracticeNode[],
  edges: readonly PracticeEdge[],
): PracticeNode[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    children.set(node.id, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    const existingChildren = children.get(edge.source);
    if (existingChildren) existingChildren.push(edge.target);
  }

  const queue = nodes
    .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
    .map((node) => node.id);
  const result: PracticeNode[] = [];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) break;

    const node = nodeMap.get(id);
    if (node) result.push(node);

    for (const childId of children.get(id) ?? []) {
      const degree = (inDegree.get(childId) ?? 1) - 1;
      inDegree.set(childId, degree);
      if (degree === 0) queue.push(childId);
    }
  }

  for (const node of nodes) {
    if (!result.includes(node)) result.push(node);
  }

  return result;
}

function deriveLinearEdges(nodes: readonly PracticeNode[]): PracticeEdge[] {
  const edges: PracticeEdge[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const source = nodes[i];
    const target = nodes[i + 1];
    if (!source || !target) continue;

    edges.push({
      id: `edge-${source.id}-${target.id}`,
      source: source.id,
      target: target.id,
    });
  }

  return edges;
}
