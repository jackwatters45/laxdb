import { useState, useCallback, useRef, useEffect } from "react";

import { createPersistedId, createTransientId } from "@/lib/ids";
import {
  addSplitToGraph,
  appendDrillToGraph,
  appendDrillWithInferredType,
  createDragStartSnapshot,
  deleteNodeAndReconnect,
  insertDrillBetweenNodes,
  moveNodeInFlow as moveNodeInPracticeFlow,
  updateNodeInGraph,
  updatePracticeGraph,
  type PracticeGraphIdFactory,
} from "@/lib/practice-graph-operations";
import type {
  PracticeGraph,
  PracticeNode,
  PracticeItemType,
  Drill,
} from "@/types";

const graphIdsForNode = (nodeId: string): PracticeGraphIdFactory => ({
  createNodeId: () => nodeId,
  createEdgeId: () => createTransientId("edge"),
});

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
      setPractice((prev) => updateNodeInGraph(prev, nodeId, updates));
    },
    [setPractice],
  );

  /** Update a node without pushing to the undo stack (for drag moves). */
  const updateNodeRaw = useCallback(
    (nodeId: string, updates: Partial<PracticeNode>) => {
      setPracticeRaw((prev) => updateNodeInGraph(prev, nodeId, updates));
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
        const beforeDrag = createDragStartSnapshot(current, nodeId, from);
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
      setPractice((prev) => updatePracticeGraph(prev, updates));
    },
    [setPractice],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setPractice((prev) => deleteNodeAndReconnect(prev, nodeId));
    },
    [setPractice],
  );

  const moveNodeInFlow = useCallback(
    (nodeId: string, direction: "up" | "down") => {
      setPractice((prev) => moveNodeInPracticeFlow(prev, nodeId, direction));
    },
    [setPractice],
  );

  const addDrillBetween = useCallback(
    (afterId: string, beforeId: string, drill: Drill) => {
      const nodeId = createPersistedId();
      const ids = graphIdsForNode(nodeId);

      setPractice(
        (prev) =>
          insertDrillBetweenNodes(prev, afterId, beforeId, drill, ids).graph,
      );

      return nodeId;
    },
    [setPractice],
  );

  const addDrillFromSidebar = useCallback(
    (drill: Drill, type: PracticeItemType) => {
      const nodeId = createPersistedId();
      const ids = graphIdsForNode(nodeId);

      setPractice((prev) => appendDrillToGraph(prev, drill, type, ids).graph);

      return nodeId;
    },
    [setPractice],
  );

  const appendDrill = useCallback(
    (drill: Drill) => {
      const nodeId = createPersistedId();
      const ids = graphIdsForNode(nodeId);

      setPractice(
        (prev) => appendDrillWithInferredType(prev, drill, ids).graph,
      );

      return nodeId;
    },
    [setPractice],
  );

  const addSplit = useCallback(
    (groups: string[]) => {
      setPractice((prev) => addSplitToGraph(prev, groups).graph);
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
