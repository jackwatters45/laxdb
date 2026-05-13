import { useMachine } from "@xstate/react";
import {
  useMemo,
  useCallback,
  type RefObject,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { setup, assign } from "xstate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

interface Positionable {
  id: string;
  position: { x: number; y: number };
}

interface UseCanvasInteractionsOptions<N extends Positionable> {
  nodes: N[];
  transform: CanvasTransform;
  onTransformChange: (t: CanvasTransform) => void;
  onSelectNode: (nodeId: string | null) => void;
  /** Called on every mousemove during a drag — bypasses undo. */
  onDragNode: (
    nodeId: string,
    updates: { position: { x: number; y: number } },
  ) => void;
  /** Called once when a drag finishes — commits to undo stack. */
  onDragEnd: (
    nodeId: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  minScale?: number;
  maxScale?: number;
  zoomSensitivity?: number;
}

const DRAG_THRESHOLD = 4;

// ---------------------------------------------------------------------------
// Machine context
// ---------------------------------------------------------------------------

interface MachineContext {
  /** Node ID being interacted with (drag intent or active drag) */
  nodeId: string | null;
  /** Mouse position at the start of a node mousedown */
  mouseStart: { x: number; y: number };
  /** Node position at the start of a node mousedown (for undo) */
  nodeStart: { x: number; y: number };
  /** Current node position during drag (for undo commit on drop) */
  nodeCurrent: { x: number; y: number };
  /** Mouse position at the start (or last tick) of a canvas pan */
  panMouseStart: { x: number; y: number };
}

// ---------------------------------------------------------------------------
// Machine events
// ---------------------------------------------------------------------------

type MachineEvent =
  | {
      type: "NODE_MOUSEDOWN";
      nodeId: string;
      clientX: number;
      clientY: number;
      nodeX: number;
      nodeY: number;
    }
  | { type: "CANVAS_MOUSEDOWN"; clientX: number; clientY: number }
  | { type: "MOUSEMOVE"; clientX: number; clientY: number }
  | { type: "MOUSEUP" }
  | { type: "CANVAS_CLICK" };

// ---------------------------------------------------------------------------
// Machine definition
// ---------------------------------------------------------------------------

const canvasInteractionMachine = setup({
  types: {
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- XState's setup API requires typed placeholders here
    context: {} as MachineContext,
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- XState's setup API requires typed placeholders here
    events: {} as MachineEvent,
  },
  guards: {
    pastDragThreshold: ({ context, event }) => {
      if (event.type !== "MOUSEMOVE") return false;
      const dx = Math.abs(event.clientX - context.mouseStart.x);
      const dy = Math.abs(event.clientY - context.mouseStart.y);
      return dx + dy >= DRAG_THRESHOLD;
    },
  },
}).createMachine({
  id: "canvasInteraction",
  initial: "idle",
  context: {
    nodeId: null,
    mouseStart: { x: 0, y: 0 },
    nodeStart: { x: 0, y: 0 },
    nodeCurrent: { x: 0, y: 0 },
    panMouseStart: { x: 0, y: 0 },
  },
  states: {
    idle: {
      on: {
        NODE_MOUSEDOWN: {
          target: "dragIntent",
          actions: assign({
            nodeId: ({ event }) => event.nodeId,
            mouseStart: ({ event }) => ({
              x: event.clientX,
              y: event.clientY,
            }),
            nodeStart: ({ event }) => ({ x: event.nodeX, y: event.nodeY }),
            nodeCurrent: ({ event }) => ({ x: event.nodeX, y: event.nodeY }),
          }),
        },
        CANVAS_MOUSEDOWN: {
          target: "panning",
          actions: assign({
            panMouseStart: ({ event }) => ({
              x: event.clientX,
              y: event.clientY,
            }),
          }),
        },
      },
    },

    dragIntent: {
      on: {
        MOUSEMOVE: [
          {
            guard: "pastDragThreshold",
            target: "dragging",
          },
          // Below threshold — stay in dragIntent, don't update anything
        ],
        MOUSEUP: {
          target: "idle",
          // Mouseup without dragging = click to select (handled in hook)
        },
      },
    },

    dragging: {
      on: {
        MOUSEMOVE: {
          actions: assign({
            nodeCurrent: ({ context, event }) => ({
              x: context.nodeStart.x + event.clientX - context.mouseStart.x,
              y: context.nodeStart.y + event.clientY - context.mouseStart.y,
            }),
          }),
        },
        MOUSEUP: {
          target: "idle",
          actions: assign({
            nodeId: () => null,
          }),
        },
      },
    },

    panning: {
      on: {
        MOUSEMOVE: {
          actions: assign({
            panMouseStart: ({ event }) => ({
              x: event.clientX,
              y: event.clientY,
            }),
          }),
        },
        MOUSEUP: {
          target: "idle",
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCanvasInteractions<N extends Positionable>({
  nodes,
  transform,
  onTransformChange,
  onSelectNode,
  onDragNode,
  onDragEnd,
  containerRef,
  minScale = 0.25,
  maxScale = 2,
  zoomSensitivity = 0.001,
}: UseCanvasInteractionsOptions<N>) {
  const [state, send] = useMachine(canvasInteractionMachine);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const isDragging = state.matches("dragging");
  const isPanning = state.matches("panning");
  const dragNodeId =
    state.matches("dragging") || state.matches("dragIntent")
      ? state.context.nodeId
      : null;
  const isNodeBeingDragged = isDragging && dragNodeId !== null;

  // --- Node: mousedown to start drag/select ---

  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: ReactMouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const node = nodeMap.get(nodeId);
      if (!node) return;

      send({
        type: "NODE_MOUSEDOWN",
        nodeId,
        clientX: e.clientX,
        clientY: e.clientY,
        nodeX: node.position.x,
        nodeY: node.position.y,
      });
    },
    [nodeMap, send],
  );

  // --- Canvas: mousedown to start pan ---

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (e.button === 0) {
        send({
          type: "CANVAS_MOUSEDOWN",
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }
    },
    [send],
  );

  // --- Mousemove: drag node or pan canvas ---

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      const currentState = state.value;

      if (currentState === "dragIntent" || currentState === "dragging") {
        // Send event to machine for threshold detection + context update
        send({ type: "MOUSEMOVE", clientX: e.clientX, clientY: e.clientY });

        // If we're in dragging (or just transitioned), update the node position
        // We read from context directly for the position calculation
        if (state.context.nodeId) {
          const dx = e.clientX - state.context.mouseStart.x;
          const dy = e.clientY - state.context.mouseStart.y;
          const dist = Math.abs(dx) + Math.abs(dy);

          // Only call onDragNode if past threshold (either already dragging or will be)
          if (currentState === "dragging" || dist >= DRAG_THRESHOLD) {
            onDragNode(state.context.nodeId, {
              position: {
                x: state.context.nodeStart.x + dx / transform.scale,
                y: state.context.nodeStart.y + dy / transform.scale,
              },
            });
          }
        }
        return;
      }

      if (currentState === "panning") {
        const dx = e.clientX - state.context.panMouseStart.x;
        const dy = e.clientY - state.context.panMouseStart.y;
        send({ type: "MOUSEMOVE", clientX: e.clientX, clientY: e.clientY });
        onTransformChange({
          ...transform,
          x: transform.x + dx,
          y: transform.y + dy,
        });
      }
    },
    [state, send, transform, onTransformChange, onDragNode],
  );

  // --- Mouseup: finish drag or finish pan ---

  const handleMouseUp = useCallback(() => {
    const currentState = state.value;

    if (currentState === "dragIntent" && state.context.nodeId) {
      // No drag happened — this is a click to select
      onSelectNode(state.context.nodeId);
    }

    if (currentState === "dragging" && state.context.nodeId) {
      // Drag finished — commit to undo stack with start → end positions
      const node = nodeMap.get(state.context.nodeId);
      if (node) {
        onDragEnd(state.context.nodeId, state.context.nodeStart, node.position);
      }
    }

    send({ type: "MOUSEUP" });
  }, [state, send, onSelectNode, onDragEnd, nodeMap]);

  // --- Wheel: Cmd+scroll = zoom, plain scroll = pan ---

  const handleWheel = useCallback(
    (e: ReactWheelEvent) => {
      e.preventDefault();

      if (e.metaKey || e.ctrlKey) {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(
          maxScale,
          Math.max(minScale, transform.scale * (1 + delta)),
        );

        const scaleRatio = newScale / transform.scale;
        onTransformChange({
          x: mouseX - (mouseX - transform.x) * scaleRatio,
          y: mouseY - (mouseY - transform.y) * scaleRatio,
          scale: newScale,
        });
      } else {
        onTransformChange({
          ...transform,
          x: transform.x - e.deltaX,
          y: transform.y - e.deltaY,
        });
      }
    },
    [
      transform,
      containerRef,
      minScale,
      maxScale,
      zoomSensitivity,
      onTransformChange,
    ],
  );

  // --- Click empty canvas to deselect ---

  const handleCanvasClick = useCallback(
    (e: ReactMouseEvent) => {
      if (
        e.target === e.currentTarget ||
        (e.target instanceof HTMLElement && e.target.dataset?.canvas)
      ) {
        onSelectNode(null);
      }
    },
    [onSelectNode],
  );

  return {
    nodeMap,
    dragNodeId,
    isDragging,
    isNodeBeingDragged,
    isPanning,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onWheel: handleWheel,
      onClick: handleCanvasClick,
    },
    handleNodeMouseDown,
  };
}
