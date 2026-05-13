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
  const [practice, setPracticeRaw] = useState(initial);
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

  /** Update a node with undo tracking. */
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

  /** Update a node without pushing to the undo stack (for drag moves). */
  const updateNodeRaw = useCallback(
    (nodeId: string, updates: Partial<PracticeNode>) => {
      setPracticeRaw((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n,
        ),
      }));
    },
    [],
  );

  /**
   * Commit a node move to the undo stack after a drag completes.
   * Records the before-position so undo restores correctly.
   */
  const commitDrag = useCallback(
    (
      nodeId: string,
      from: { x: number; y: number },
      to: { x: number; y: number },
    ) => {
      // Only commit if the position actually changed
      if (from.x === to.x && from.y === to.y) return;

      // Push current state (with the node at its final position) as a new undo entry,
      // but the snapshot we push is the state *before* the drag started.
      setPracticeRaw((current) => {
        const beforeDrag: PracticeGraph = {
          ...current,
          nodes: current.nodes.map((n) =>
            n.id === nodeId ? { ...n, position: from } : n,
          ),
        };
        undoStack.current.push(beforeDrag);
        if (undoStack.current.length > 50) undoStack.current.shift();
        redoStack.current = [];
        return current; // keep current state unchanged
      });
    },
    [],
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
      const nodeId = nextId("node");

      setPractice((prev) => {
        const afterNode = prev.nodes.find((n) => n.id === afterId);
        const beforeNode = prev.nodes.find((n) => n.id === beforeId);
        if (!afterNode || !beforeNode) return prev;

        const newNode: PracticeNode = {
          id: nodeId,
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

        const newEdges = prev.edges.filter(
          (e) => !(e.source === afterId && e.target === beforeId),
        );
        newEdges.push(
          { id: nextId("edge"), source: afterId, target: nodeId },
          { id: nextId("edge"), source: nodeId, target: beforeId },
        );
        return { ...prev, nodes: [...prev.nodes, newNode], edges: newEdges };
      });

      return nodeId;
    },
    [setPractice],
  );

  const addDrillFromSidebar = useCallback(
    (drill: Drill, type: PracticeItemType) => {
      const nodeId = nextId("node");

      setPractice((prev) => {
        const sourcesSet = new Set(prev.edges.map((e) => e.source));
        const lastNode =
          prev.nodes.find((n) => !sourcesSet.has(n.id)) ?? prev.nodes.at(-1);

        const newNode: PracticeNode = {
          id: nodeId,
          type,
          variant: "default",
          drillId: drill.publicId,
          label: drill.name,
          durationMinutes: drill.durationMinutes,
          notes: drill.subtitle,
          groups: ["all"],
          priority: "optional",
          position: lastNode
            ? {
                x: lastNode.position.x,
                y: lastNode.position.y + 140,
              }
            : { x: 0, y: 0 },
        };

        return {
          ...prev,
          nodes: [...prev.nodes, newNode],
          edges: lastNode
            ? [
                ...prev.edges,
                { id: nextId("edge"), source: lastNode.id, target: nodeId },
              ]
            : prev.edges,
        };
      });

      return nodeId;
    },
    [setPractice],
  );

  const appendDrill = useCallback(
    (drill: Drill) => addDrillFromSidebar(drill, drillToType(drill)),
    [addDrillFromSidebar],
  );

  const addSplit = useCallback(
    (groups: string[]) => {
      setPractice((prev) => {
        const sourcesSet = new Set(prev.edges.map((e) => e.source));
        const lastNode =
          prev.nodes.findLast((n) => !sourcesSet.has(n.id)) ??
          prev.nodes.at(-1);
        if (!lastNode) return prev;

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

        return {
          ...prev,
          nodes: [...prev.nodes, ...newNodes],
          edges: [...prev.edges, ...newEdges],
        };
      });
    },
    [setPractice],
  );

  return {
    practice,
    nodes: practice.nodes,
    edges: practice.edges,
    setPractice,
    updateNode,
    updateNodeRaw,
    commitDrag,
    updatePractice,
    deleteNode,
    moveNodeInFlow,
    addDrillBetween,
    addDrillFromSidebar,
    appendDrill,
    addSplit,
  };
}
