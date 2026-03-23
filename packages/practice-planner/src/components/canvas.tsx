import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import type { Drill, PracticeNode, PracticeEdge } from "@/data/types";
import { getNodeGeometry, getEdgeAnchors } from "@/lib/node-geometry";

import { AddNodeButton } from "./add-node-button";
import type { CanvasMode } from "./canvas-controls";
import { WorkflowEdge } from "./workflow-edge";
import { WorkflowNode } from "./workflow-node";

interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

interface CanvasProps {
  nodes: PracticeNode[];
  edges: PracticeEdge[];
  selectedNodeId: string | null;
  mode: CanvasMode;
  transform: CanvasTransform;
  onTransformChange: (t: CanvasTransform) => void;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNode: (nodeId: string, updates: Partial<PracticeNode>) => void;
  onMoveNodeToEdge: (nodeId: string, edgeId: string | null) => void;
  onAddDrill: (afterNodeId: string, beforeNodeId: string, drill: Drill) => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 2;
const ZOOM_SENSITIVITY = 0.001;
const DRAG_THRESHOLD = 4;
const EDGE_SNAP_DISTANCE = 40;

/** Distance from point (px,py) to line segment (ax,ay)-(bx,by) */
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function Canvas({
  nodes,
  edges,
  selectedNodeId,
  mode,
  transform,
  onTransformChange,
  onSelectNode,
  onUpdateNode,
  onMoveNodeToEdge,
  onAddDrill,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);

  // Drag state
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoverEdgeId, setHoverEdgeId] = useState<string | null>(null);

  // Build node map for edge lookup
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Keyboard: space to temporarily enable pan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpaceHeld(false);
        setIsPanning(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const shouldPan = mode === "pan" || spaceHeld;

  /** Find the nearest edge to a canvas-space point, excluding edges connected to nodeId */
  const findNearestEdge = useCallback(
    (canvasX: number, canvasY: number, excludeNodeId: string): string | null => {
      let bestDist = EDGE_SNAP_DISTANCE;
      let bestEdgeId: string | null = null;

      for (const edge of edges) {
        // Skip edges connected to the dragged node
        if (edge.source === excludeNodeId || edge.target === excludeNodeId) continue;

        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) continue;

        const { sx, sy, tx, ty } = getEdgeAnchors(source, target);
        const dist = distToSegment(canvasX, canvasY, sx, sy, tx, ty);

        if (dist < bestDist) {
          bestDist = dist;
          bestEdgeId = edge.id;
        }
      }

      return bestEdgeId;
    },
    [edges, nodeMap],
  );

  // --- Node drag handlers ---

  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: ReactMouseEvent) => {
      if (shouldPan || e.button !== 0) return;
      e.stopPropagation();

      const node = nodeMap.get(nodeId);
      if (!node) return;

      setDragNodeId(nodeId);
      setDragStart({
        mouseX: e.clientX,
        mouseY: e.clientY,
        nodeX: node.position.x,
        nodeY: node.position.y,
      });
      setIsDragging(false);
      setHoverEdgeId(null);
    },
    [shouldPan, nodeMap],
  );

  // --- Canvas-level mouse handlers ---

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (shouldPan && e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        e.preventDefault();
      }
    },
    [shouldPan, transform.x, transform.y],
  );

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      // Node dragging takes priority
      if (dragNodeId) {
        const dx = e.clientX - dragStart.mouseX;
        const dy = e.clientY - dragStart.mouseY;

        // Only start dragging after threshold to distinguish from clicks
        if (!isDragging && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
        setIsDragging(true);

        // Convert screen delta to canvas coordinates (account for zoom)
        const newX = dragStart.nodeX + dx / transform.scale;
        const newY = dragStart.nodeY + dy / transform.scale;

        onUpdateNode(dragNodeId, { position: { x: newX, y: newY } });

        // Find nearest edge for drop target highlight
        const draggedNode = nodeMap.get(dragNodeId);
        if (draggedNode) {
          const geo = getNodeGeometry({ ...draggedNode, position: { x: newX, y: newY } });
          const nodeCenterX = geo.left + geo.width / 2;
          const nodeCenterY = geo.top + geo.height / 2;
          setHoverEdgeId(findNearestEdge(nodeCenterX, nodeCenterY, dragNodeId));
        }

        return;
      }

      if (isPanning) {
        onTransformChange({
          ...transform,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [dragNodeId, dragStart, isDragging, isPanning, panStart, transform, onTransformChange, onUpdateNode, findNearestEdge],
  );

  const handleMouseUp = useCallback(() => {
    if (dragNodeId) {
      if (!isDragging) {
        // Was a click, not a drag — select the node
        onSelectNode(dragNodeId);
      } else if (hoverEdgeId) {
        // Dropped on an edge — detach and reinsert
        onMoveNodeToEdge(dragNodeId, hoverEdgeId);
      }
      // else: just a reposition, graph stays unchanged
      setDragNodeId(null);
      setIsDragging(false);
      setHoverEdgeId(null);
    }
    setIsPanning(false);
  }, [dragNodeId, isDragging, hoverEdgeId, onSelectNode, onMoveNodeToEdge]);

  const handleWheel = useCallback(
    (e: ReactWheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, transform.scale * (1 + delta)),
      );

      // Zoom toward mouse position
      const scaleRatio = newScale / transform.scale;
      const newX = mouseX - (mouseX - transform.x) * scaleRatio;
      const newY = mouseY - (mouseY - transform.y) * scaleRatio;

      onTransformChange({ x: newX, y: newY, scale: newScale });
    },
    [transform, onTransformChange],
  );

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

  // Compute SVG bounds using rendered geometry (accounts for centering offsets)
  const svgBounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, w: 100, h: 100 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of nodes) {
      const g = getNodeGeometry(node);
      minX = Math.min(minX, g.left);
      minY = Math.min(minY, g.top);
      maxX = Math.max(maxX, g.left + g.width);
      maxY = Math.max(maxY, g.top + g.height);
    }
    const pad = 200;
    return {
      minX: minX - pad,
      minY: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    };
  }, [nodes]);

  const isNodeBeingDragged = dragNodeId !== null && isDragging;

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden ${
        isNodeBeingDragged
          ? "cursor-grabbing"
          : shouldPan
            ? isPanning
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      // Dot pattern background
      style={{
        backgroundImage: `radial-gradient(circle, oklch(var(--border)) 1px, transparent 1px)`,
        backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
    >
      {/* Transform container */}
      <div
        data-canvas="true"
        className="origin-top-left"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
        onClick={handleCanvasClick}
      >
        {/* SVG edges layer */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: svgBounds.minX,
            top: svgBounds.minY,
            width: svgBounds.w,
            height: svgBounds.h,
            overflow: "visible",
          }}
        >
          <g transform={`translate(${-svgBounds.minX}, ${-svgBounds.minY})`}>
            {edges.map((edge) => {
              const source = nodeMap.get(edge.source);
              const target = nodeMap.get(edge.target);
              if (!source || !target) return null;
              return (
                <WorkflowEdge
                  key={edge.id}
                  edge={edge}
                  sourceNode={source}
                  targetNode={target}
                  isDropTarget={hoverEdgeId === edge.id}
                />
              );
            })}
          </g>
        </svg>

        {/* Add-between buttons (hidden while dragging) */}
        {!isNodeBeingDragged &&
          edges.map((edge) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;
            return (
              <AddNodeButton
                key={`add-${edge.id}`}
                sourceNode={source}
                targetNode={target}
                onAddDrill={onAddDrill}
              />
            );
          })}

        {/* Node layer */}
        {nodes.map((node) => {
          const geo = getNodeGeometry(node);
          const beingDragged = dragNodeId === node.id && isDragging;

          return (
            <div
              key={node.id}
              className="absolute left-0 top-0"
              style={{
                transform: `translate(${geo.left}px, ${geo.top}px)`,
                transition: beingDragged || isPanning
                  ? "none"
                  : "transform 0.2s ease-out",
                zIndex: beingDragged ? 50 : undefined,
              }}
              onMouseDown={(e) => { handleNodeMouseDown(node.id, e); }}
            >
              <WorkflowNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={onSelectNode}
                scale={transform.scale}
                isDragging={beingDragged}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
