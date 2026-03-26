import {
  useState,
  useCallback,
  useRef,
  useMemo,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
  type RefObject,
} from "react";

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
  onUpdateNode: (
    nodeId: string,
    updates: { position: { x: number; y: number } },
  ) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  minScale?: number;
  maxScale?: number;
  zoomSensitivity?: number;
  dragThreshold?: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCanvasInteractions<N extends Positionable>({
  nodes,
  transform,
  onTransformChange,
  onSelectNode,
  onUpdateNode,
  containerRef,
  minScale = 0.25,
  maxScale = 2,
  zoomSensitivity = 0.001,
  dragThreshold = 4,
}: UseCanvasInteractionsOptions<N>) {
  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Node drag state
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const isNodeBeingDragged = dragNodeId !== null && isDragging;

  // --- Node: mousedown to start drag/select ---

  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: ReactMouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const node = nodeMap.get(nodeId);
      if (!node) return;

      setDragNodeId(nodeId);
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        nodeX: node.position.x,
        nodeY: node.position.y,
      };
      setIsDragging(false);
    },
    [nodeMap],
  );

  // --- Canvas: mousedown to start pan ---

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (e.button === 0) {
        setIsPanning(true);
        panStart.current = {
          x: e.clientX - transform.x,
          y: e.clientY - transform.y,
        };
      }
    },
    [transform.x, transform.y],
  );

  // --- Mousemove: drag node or pan canvas ---

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      if (dragNodeId) {
        const dx = e.clientX - dragStart.current.mouseX;
        const dy = e.clientY - dragStart.current.mouseY;

        if (!isDragging && Math.abs(dx) + Math.abs(dy) < dragThreshold) return;
        setIsDragging(true);

        onUpdateNode(dragNodeId, {
          position: {
            x: dragStart.current.nodeX + dx / transform.scale,
            y: dragStart.current.nodeY + dy / transform.scale,
          },
        });
        return;
      }

      if (isPanning) {
        onTransformChange({
          ...transform,
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y,
        });
      }
    },
    [
      dragNodeId,
      isDragging,
      isPanning,
      transform,
      dragThreshold,
      onTransformChange,
      onUpdateNode,
    ],
  );

  // --- Mouseup: finish drag (select if click) or finish pan ---

  const handleMouseUp = useCallback(() => {
    if (dragNodeId) {
      if (!isDragging) onSelectNode(dragNodeId);
      setDragNodeId(null);
      setIsDragging(false);
    }
    setIsPanning(false);
  }, [dragNodeId, isDragging, onSelectNode]);

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
        (e.target as HTMLElement).dataset?.canvas
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
