import { useState, useCallback, useRef, useEffect } from "react";

import { drillToType } from "@/lib/drill-utils";
import type {
  PracticeGraph,
  PracticeNode,
  PracticeEdge,
  PracticeItemType,
  Drill,
} from "@/types";

function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function usePracticeEditor(initial: PracticeGraph) {
  const [practice, setPracticeRaw] = useState<PracticeGraph>(initial);
  const undoStack = useRef<PracticeGraph[]>([]);
  const redoStack = useRef<PracticeGraph[]>([]);

  const setPractice = useCallback(
    (updater: PracticeGraph | ((prev: PracticeGraph) => PracticeGraph)) => {
      setPracticeRaw((prev) => {
        undoStack.current.push(prev);
        if (undoStack.current.length > 50) undoStack.current.shift();
        redoStack.current = [];
        return typeof updater === "function" ? updater(prev) : updater;
      });
    },
    [],
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev) {
      setPracticeRaw((current) => {
        redoStack.current.push(current);
        return prev;
      });
    }
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (next) {
      setPracticeRaw((current) => {
        undoStack.current.push(current);
        return next;
      });
    }
  }, []);

  // Cmd+Z / Cmd+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  // --- Mutations ---

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<PracticeNode>) => {
      setPractice((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n,
        ),
      }));
    },
    [setPractice],
  );

  const updatePractice = useCallback(
    (updates: Partial<PracticeGraph>) => {
      setPractice((prev) => ({ ...prev, ...updates }));
    },
    [setPractice],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setPractice((prev) => {
        const incomingEdges = prev.edges.filter((e) => e.target === nodeId);
        const outgoingEdges = prev.edges.filter((e) => e.source === nodeId);

        const newEdges = prev.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        );

        // Reconnect neighbors
        for (const ie of incomingEdges) {
          for (const oe of outgoingEdges) {
            newEdges.push({
              id: nextId("edge"),
              source: ie.source,
              target: oe.target,
            });
          }
        }

        return {
          ...prev,
          nodes: prev.nodes.filter((n) => n.id !== nodeId),
          edges: newEdges,
        };
      });
    },
    [setPractice],
  );

  const moveNodeInFlow = useCallback(
    (nodeId: string, direction: "up" | "down") => {
      setPractice((prev) => {
        const siblingEdge =
          direction === "up"
            ? prev.edges.find((e) => e.target === nodeId)
            : prev.edges.find((e) => e.source === nodeId);
        if (!siblingEdge) return prev;

        const siblingId =
          direction === "up" ? siblingEdge.source : siblingEdge.target;
        const sibling = prev.nodes.find((n) => n.id === siblingId);
        if (!sibling || sibling.variant === "start") return prev;

        const node = prev.nodes.find((n) => n.id === nodeId);
        if (!node) return prev;

        const newNodes = prev.nodes.map((n) => {
          if (n.id === nodeId) return { ...n, position: sibling.position };
          if (n.id === siblingId) return { ...n, position: node.position };
          return n;
        });

        const newEdges = prev.edges.map((e) => {
          let source = e.source;
          let target = e.target;
          if (source === nodeId) source = siblingId;
          else if (source === siblingId) source = nodeId;
          if (target === nodeId) target = siblingId;
          else if (target === siblingId) target = nodeId;
          return source === e.source && target === e.target
            ? e
            : { ...e, source, target };
        });

        return { ...prev, nodes: newNodes, edges: newEdges };
      });
    },
    [setPractice],
  );

  const addDrillBetween = useCallback(
    (afterId: string, beforeId: string, drill: Drill) => {
      const afterNode = practice.nodes.find((n) => n.id === afterId);
      const beforeNode = practice.nodes.find((n) => n.id === beforeId);
      if (!afterNode || !beforeNode) return;

      const newNode: PracticeNode = {
        id: nextId("node"),
        type: drillToType(drill),
        variant: "default",
        drillId: drill.publicId,
        label: drill.name,
        durationMinutes: drill.durationMinutes,
        notes: drill.subtitle,
        groups: ["all"],
        priority: "optional",
        position: {
          x: (afterNode.position.x + beforeNode.position.x) / 2,
          y: (afterNode.position.y + beforeNode.position.y) / 2,
        },
      };

      setPractice((prev) => {
        const newEdges = prev.edges.filter(
          (e) => !(e.source === afterId && e.target === beforeId),
        );
        newEdges.push(
          { id: nextId("edge"), source: afterId, target: newNode.id },
          { id: nextId("edge"), source: newNode.id, target: beforeId },
        );
        return { ...prev, nodes: [...prev.nodes, newNode], edges: newEdges };
      });

      return newNode.id;
    },
    [practice.nodes, setPractice],
  );

  const addDrillFromSidebar = useCallback(
    (drill: Drill, type: PracticeItemType) => {
      const { nodes: n, edges: e } = practice;
      const sourcesSet = new Set(e.map((edge) => edge.source));
      const lastNode = n.find((node) => !sourcesSet.has(node.id)) ?? n.at(-1);
      if (!lastNode) return;

      const newNode: PracticeNode = {
        id: nextId("node"),
        type,
        variant: "default",
        drillId: drill.publicId,
        label: drill.name,
        durationMinutes: drill.durationMinutes,
        notes: drill.subtitle,
        groups: ["all"],
        priority: "optional",
        position: {
          x: lastNode.position.x,
          y: lastNode.position.y + 140,
        },
      };

      setPractice((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
        edges: [
          ...prev.edges,
          { id: nextId("edge"), source: lastNode.id, target: newNode.id },
        ],
      }));

      return newNode.id;
    },
    [practice, setPractice],
  );

  const appendDrill = useCallback(
    (drill: Drill) => addDrillFromSidebar(drill, drillToType(drill)),
    [addDrillFromSidebar],
  );

  const addSplit = useCallback(
    (groups: string[]) => {
      const { nodes: n, edges: e } = practice;
      const sourcesSet = new Set(e.map((edge) => edge.source));
      const lastNode =
        n.filter((node) => !sourcesSet.has(node.id)).at(-1) ?? n.at(-1);
      if (!lastNode) return;

      const splitNode: PracticeNode = {
        id: nextId("node"),
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
        { id: nextId("edge"), source: lastNode.id, target: splitNode.id },
      ];

      const laneWidth = 280;
      const totalWidth = groups.length * laneWidth;
      const startX = splitNode.position.x - totalWidth / 2 + laneWidth / 2;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (!group) continue;
        const laneNode: PracticeNode = {
          id: nextId("node"),
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
        newNodes.push(laneNode);
        newEdges.push({
          id: nextId("edge"),
          source: splitNode.id,
          target: laneNode.id,
          label: group,
        });
      }

      setPractice((prev) => ({
        ...prev,
        nodes: [...prev.nodes, ...newNodes],
        edges: [...prev.edges, ...newEdges],
      }));
    },
    [practice, setPractice],
  );

  return {
    practice,
    nodes: practice.nodes,
    edges: practice.edges,
    setPractice,
    updateNode,
    updatePractice,
    deleteNode,
    moveNodeInFlow,
    addDrillBetween,
    addDrillFromSidebar,
    appendDrill,
    addSplit,
  };
}
