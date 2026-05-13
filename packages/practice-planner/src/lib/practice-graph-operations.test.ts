import { describe, expect, it } from "vitest";

import type { Drill, PracticeGraph, PracticeNode } from "@/types";

import {
  addSplitToGraph,
  connectLinearNodes,
  deleteNodeAndReconnect,
  insertDrillBetweenNodes,
  moveNodeInFlow,
  type PracticeGraphIdFactory,
} from "./practice-graph-operations";

const makeIds = (): PracticeGraphIdFactory => {
  let nodeIndex = 0;
  let edgeIndex = 0;

  return {
    createNodeId: () => `node-${nodeIndex++}`,
    createEdgeId: () => `edge-${edgeIndex++}`,
  };
};

const node = (
  id: string,
  y: number,
  variant: PracticeNode["variant"] = "default",
): PracticeNode => ({
  id,
  type: "drill",
  variant,
  drillId: null,
  label: id,
  durationMinutes: 10,
  notes: null,
  groups: ["all"],
  priority: "optional",
  position: { x: 0, y },
});

const graph = (nodes: PracticeNode[]): PracticeGraph => ({
  id: "practice-1",
  name: "Practice",
  date: null,
  description: null,
  notes: null,
  durationMinutes: 60,
  location: null,
  status: "draft",
  nodes,
  edges: connectLinearNodes(nodes, makeIds()),
});

const drill: Drill = {
  publicId: "abcdefghijkl",
  name: "Passing Drill",
  subtitle: "Move the ball",
  description: null,
  difficulty: "beginner",
  category: ["passing"],
  positionGroup: ["all"],
  intensity: "medium",
  contact: false,
  competitive: false,
  playerCount: 12,
  durationMinutes: 15,
  fieldSpace: "half-field",
  equipment: [],
  diagramUrl: null,
  videoUrl: null,
  coachNotes: null,
  tags: [],
};

describe("practice graph operations", () => {
  it("deletes a node and reconnects its neighbors", () => {
    const initial = graph([
      node("start", 0, "start"),
      node("a", 140),
      node("b", 280),
    ]);

    const result = deleteNodeAndReconnect(initial, "a", makeIds());

    expect(result.nodes.map((practiceNode) => practiceNode.id)).toEqual([
      "start",
      "b",
    ]);
    expect(result.edges).toEqual([
      { id: "edge-0", source: "start", target: "b" },
    ]);
  });

  it("inserts a drill between two connected nodes", () => {
    const initial = graph([node("start", 0, "start"), node("end", 280)]);

    const result = insertDrillBetweenNodes(
      initial,
      "start",
      "end",
      drill,
      makeIds(),
    );

    expect(result.nodeId).toBe("node-0");
    expect(result.graph.nodes.at(-1)).toMatchObject({
      id: "node-0",
      drillId: drill.publicId,
      label: drill.name,
      position: { x: 0, y: 140 },
    });
    expect(result.graph.edges).toEqual([
      { id: "edge-0", source: "start", target: "node-0" },
      { id: "edge-1", source: "node-0", target: "end" },
    ]);
  });

  it("moves a node in the linear flow without moving the start node", () => {
    const initial = graph([
      node("start", 0, "start"),
      node("a", 140),
      node("b", 280),
    ]);

    expect(moveNodeInFlow(initial, "a", "up")).toBe(initial);

    const moved = moveNodeInFlow(initial, "a", "down");

    expect(
      moved.nodes.find((practiceNode) => practiceNode.id === "a")?.position,
    ).toEqual({
      x: 0,
      y: 280,
    });
    expect(
      moved.nodes.find((practiceNode) => practiceNode.id === "b")?.position,
    ).toEqual({
      x: 0,
      y: 140,
    });
    expect(moved.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ["start", "b"],
      ["b", "a"],
    ]);
  });

  it("adds a split with one lane per group", () => {
    const initial = graph([node("start", 0, "start")]);

    const result = addSplitToGraph(initial, ["A", "B"], makeIds());

    expect(result.splitNodeId).toBe("node-0");
    expect(result.laneNodeIds).toEqual(["node-1", "node-2"]);
    expect(
      result.graph.nodes.map((practiceNode) => practiceNode.label),
    ).toEqual(["start", "Group Split", "A Drill", "B Drill"]);
    expect(result.graph.edges).toEqual([
      { id: "edge-0", source: "start", target: "node-0" },
      { id: "edge-1", source: "node-0", target: "node-1", label: "A" },
      { id: "edge-2", source: "node-0", target: "node-2", label: "B" },
    ]);
  });
});
