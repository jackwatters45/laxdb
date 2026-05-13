import { drillToType } from "@/lib/drill-utils";
import { createPersistedId, createTransientId } from "@/lib/ids";
import type {
  Drill,
  PracticeEdge,
  PracticeGraph,
  PracticeItemType,
  PracticeNode,
} from "@/types";

export interface PracticeGraphIdFactory {
  readonly createNodeId: () => string;
  readonly createEdgeId: () => string;
}

export interface AddPracticeNodeResult {
  readonly graph: PracticeGraph;
  readonly nodeId: string;
}

export interface AddPracticeSplitResult {
  readonly graph: PracticeGraph;
  readonly splitNodeId: string;
  readonly laneNodeIds: readonly string[];
}

export const defaultPracticeGraphIds: PracticeGraphIdFactory = {
  createNodeId: createPersistedId,
  createEdgeId: () => createTransientId("edge"),
};

export const updateNodeInGraph = (
  graph: PracticeGraph,
  nodeId: string,
  updates: Partial<PracticeNode>,
): PracticeGraph => ({
  ...graph,
  nodes: graph.nodes.map((node) =>
    node.id === nodeId ? { ...node, ...updates } : node,
  ),
});

export const updatePracticeGraph = (
  graph: PracticeGraph,
  updates: Partial<PracticeGraph>,
): PracticeGraph => ({ ...graph, ...updates });

export const createDragStartSnapshot = (
  graph: PracticeGraph,
  nodeId: string,
  from: { readonly x: number; readonly y: number },
): PracticeGraph =>
  updateNodeInGraph(graph, nodeId, {
    position: { x: from.x, y: from.y },
  });

export const deleteNodeAndReconnect = (
  graph: PracticeGraph,
  nodeId: string,
  ids: PracticeGraphIdFactory = defaultPracticeGraphIds,
): PracticeGraph => {
  const incomingEdges = graph.edges.filter((edge) => edge.target === nodeId);
  const outgoingEdges = graph.edges.filter((edge) => edge.source === nodeId);
  const remainingEdges = graph.edges.filter(
    (edge) => edge.source !== nodeId && edge.target !== nodeId,
  );
  const reconnectedEdges: PracticeEdge[] = [];

  for (const incomingEdge of incomingEdges) {
    for (const outgoingEdge of outgoingEdges) {
      reconnectedEdges.push({
        id: ids.createEdgeId(),
        source: incomingEdge.source,
        target: outgoingEdge.target,
      });
    }
  }

  return {
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== nodeId),
    edges: [...remainingEdges, ...reconnectedEdges],
  };
};

export const moveNodeInFlow = (
  graph: PracticeGraph,
  nodeId: string,
  direction: "up" | "down",
): PracticeGraph => {
  const siblingEdge =
    direction === "up"
      ? graph.edges.find((edge) => edge.target === nodeId)
      : graph.edges.find((edge) => edge.source === nodeId);
  if (!siblingEdge) return graph;

  const siblingId =
    direction === "up" ? siblingEdge.source : siblingEdge.target;
  const sibling = graph.nodes.find((node) => node.id === siblingId);
  if (!sibling || sibling.variant === "start") return graph;

  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return graph;

  const nodes = graph.nodes.map((candidate) => {
    if (candidate.id === nodeId) {
      return { ...candidate, position: sibling.position };
    }
    if (candidate.id === siblingId) {
      return { ...candidate, position: node.position };
    }
    return candidate;
  });

  const edges = graph.edges.map((edge) => {
    let source = edge.source;
    let target = edge.target;

    if (source === nodeId) source = siblingId;
    else if (source === siblingId) source = nodeId;

    if (target === nodeId) target = siblingId;
    else if (target === siblingId) target = nodeId;

    return source === edge.source && target === edge.target
      ? edge
      : { ...edge, source, target };
  });

  return { ...graph, nodes, edges };
};

const createDrillNode = ({
  drill,
  nodeId,
  type,
  position,
}: {
  readonly drill: Drill;
  readonly nodeId: string;
  readonly type: PracticeItemType;
  readonly position: { readonly x: number; readonly y: number };
}): PracticeNode => ({
  id: nodeId,
  type,
  variant: "default",
  drillId: drill.publicId,
  label: drill.name,
  durationMinutes: drill.durationMinutes,
  notes: drill.subtitle,
  groups: ["all"],
  priority: "optional",
  position: { x: position.x, y: position.y },
});

export const insertDrillBetweenNodes = (
  graph: PracticeGraph,
  afterId: string,
  beforeId: string,
  drill: Drill,
  ids: PracticeGraphIdFactory = defaultPracticeGraphIds,
): AddPracticeNodeResult => {
  const nodeId = ids.createNodeId();
  const afterNode = graph.nodes.find((node) => node.id === afterId);
  const beforeNode = graph.nodes.find((node) => node.id === beforeId);

  if (!afterNode || !beforeNode) {
    return { graph, nodeId };
  }

  const newNode = createDrillNode({
    drill,
    nodeId,
    type: drillToType(drill),
    position: {
      x: (afterNode.position.x + beforeNode.position.x) / 2,
      y: (afterNode.position.y + beforeNode.position.y) / 2,
    },
  });

  const edges = graph.edges.filter(
    (edge) => !(edge.source === afterId && edge.target === beforeId),
  );
  edges.push(
    { id: ids.createEdgeId(), source: afterId, target: nodeId },
    { id: ids.createEdgeId(), source: nodeId, target: beforeId },
  );

  return {
    graph: { ...graph, nodes: [...graph.nodes, newNode], edges },
    nodeId,
  };
};

export const appendDrillToGraph = (
  graph: PracticeGraph,
  drill: Drill,
  type: PracticeItemType,
  ids: PracticeGraphIdFactory = defaultPracticeGraphIds,
): AddPracticeNodeResult => {
  const nodeId = ids.createNodeId();
  const sourcesSet = new Set(graph.edges.map((edge) => edge.source));
  const lastNode =
    graph.nodes.find((node) => !sourcesSet.has(node.id)) ?? graph.nodes.at(-1);

  const newNode = createDrillNode({
    drill,
    nodeId,
    type,
    position: lastNode
      ? {
          x: lastNode.position.x,
          y: lastNode.position.y + 140,
        }
      : { x: 0, y: 0 },
  });

  return {
    graph: {
      ...graph,
      nodes: [...graph.nodes, newNode],
      edges: lastNode
        ? [
            ...graph.edges,
            { id: ids.createEdgeId(), source: lastNode.id, target: nodeId },
          ]
        : graph.edges,
    },
    nodeId,
  };
};

export const appendDrillWithInferredType = (
  graph: PracticeGraph,
  drill: Drill,
  ids: PracticeGraphIdFactory = defaultPracticeGraphIds,
): AddPracticeNodeResult =>
  appendDrillToGraph(graph, drill, drillToType(drill), ids);

export const addSplitToGraph = (
  graph: PracticeGraph,
  groups: readonly string[],
  ids: PracticeGraphIdFactory = defaultPracticeGraphIds,
): AddPracticeSplitResult => {
  const sourcesSet = new Set(graph.edges.map((edge) => edge.source));
  const lastNode =
    graph.nodes.findLast((node) => !sourcesSet.has(node.id)) ??
    graph.nodes.at(-1);

  if (!lastNode) {
    return { graph, splitNodeId: "", laneNodeIds: [] };
  }

  const splitNode: PracticeNode = {
    id: ids.createNodeId(),
    type: "activity",
    variant: "split",
    drillId: null,
    label: "Group Split",
    durationMinutes: null,
    notes: `Split into: ${groups.join(", ")}`,
    groups: ["all"],
    priority: "required",
    position: { x: lastNode.position.x, y: lastNode.position.y + 140 },
  };

  const newNodes: PracticeNode[] = [splitNode];
  const newEdges: PracticeEdge[] = [
    { id: ids.createEdgeId(), source: lastNode.id, target: splitNode.id },
  ];
  const laneNodeIds: string[] = [];

  const laneWidth = 280;
  const totalWidth = groups.length * laneWidth;
  const startX = splitNode.position.x - totalWidth / 2 + laneWidth / 2;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (!group) continue;

    const laneNode: PracticeNode = {
      id: ids.createNodeId(),
      type: "drill",
      variant: "default",
      drillId: null,
      label: `${group} Drill`,
      durationMinutes: 15,
      notes: null,
      groups: [group],
      priority: "optional",
      position: {
        x: startX + i * laneWidth,
        y: splitNode.position.y + 160,
      },
    };

    laneNodeIds.push(laneNode.id);
    newNodes.push(laneNode);
    newEdges.push({
      id: ids.createEdgeId(),
      source: splitNode.id,
      target: laneNode.id,
      label: group,
    });
  }

  return {
    graph: {
      ...graph,
      nodes: [...graph.nodes, ...newNodes],
      edges: [...graph.edges, ...newEdges],
    },
    splitNodeId: splitNode.id,
    laneNodeIds,
  };
};

export const connectLinearNodes = (
  nodes: readonly PracticeNode[],
  ids: PracticeGraphIdFactory = defaultPracticeGraphIds,
): PracticeEdge[] => {
  const edges: PracticeEdge[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const source = nodes[i];
    const target = nodes[i + 1];
    if (!source || !target) continue;

    edges.push({
      id: ids.createEdgeId(),
      source: source.id,
      target: target.id,
    });
  }

  return edges;
};
