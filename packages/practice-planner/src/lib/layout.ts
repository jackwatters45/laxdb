import type { PracticeNode, PracticeEdge } from "@/data/types";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;
const VERTICAL_GAP = 40;
const HORIZONTAL_GAP = 60;

interface LayoutResult {
  nodes: PracticeNode[];
}

/**
 * Auto-layout: arranges nodes in a top-to-bottom flow.
 * Nodes with the same source fan out horizontally.
 * Uses a simple topological sort with layer assignment.
 */
export function autoLayout(
  nodes: PracticeNode[],
  edges: PracticeEdge[],
): LayoutResult {
  if (nodes.length === 0) return { nodes: [] };

  // Build adjacency maps
  const childrenOf = new Map<string, string[]>();
  const parentsOf = new Map<string, string[]>();
  for (const edge of edges) {
    const c = childrenOf.get(edge.source) ?? [];
    c.push(edge.target);
    childrenOf.set(edge.source, c);

    const p = parentsOf.get(edge.target) ?? [];
    p.push(edge.source);
    parentsOf.set(edge.target, p);
  }

  // Find roots (no incoming edges)
  const nodeIds = new Set(nodes.map((n) => n.id));
  const roots = nodes.filter((n) => {
    const parents = parentsOf.get(n.id);
    return !parents || parents.length === 0;
  });

  // Assign layers via BFS
  const layerOf = new Map<string, number>();
  const queue: Array<{ id: string; layer: number }> = roots.map((r) => ({
    id: r.id,
    layer: 0,
  }));

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    const { id, layer } = item;

    const existing = layerOf.get(id);
    if (existing !== undefined && existing >= layer) continue;
    layerOf.set(id, layer);

    const children = childrenOf.get(id) ?? [];
    for (const child of children) {
      if (nodeIds.has(child)) {
        queue.push({ id: child, layer: layer + 1 });
      }
    }
  }

  // Assign layer to any orphans not reached by BFS
  let maxLayer = 0;
  for (const l of layerOf.values()) {
    if (l > maxLayer) maxLayer = l;
  }
  for (const node of nodes) {
    if (!layerOf.has(node.id)) {
      maxLayer++;
      layerOf.set(node.id, maxLayer);
    }
  }

  // Group nodes by layer
  const layers = new Map<number, string[]>();
  for (const [id, layer] of layerOf.entries()) {
    const arr = layers.get(layer) ?? [];
    arr.push(id);
    layers.set(layer, arr);
  }

  // Position nodes
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const result: PracticeNode[] = [];

  const sortedLayers = [...layers.entries()].toSorted((a, b) => a[0] - b[0]);

  for (const [layerIdx, layerNodeIds] of sortedLayers) {
    const count = layerNodeIds.length;
    const totalWidth = count * NODE_WIDTH + (count - 1) * HORIZONTAL_GAP;
    const startX = -totalWidth / 2 + NODE_WIDTH / 2;

    for (let i = 0; i < layerNodeIds.length; i++) {
      const nodeId = layerNodeIds[i];
      if (!nodeId) continue;
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      result.push({
        ...node,
        position: {
          x: startX + i * (NODE_WIDTH + HORIZONTAL_GAP),
          y: layerIdx * (NODE_HEIGHT + VERTICAL_GAP),
        },
      });
    }
  }

  return { nodes: result };
}
