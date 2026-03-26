import { Button } from "@laxdb/ui/components/ui/button";
import { Plus } from "lucide-react";
import {
  useState,
  useRef,
  useCallback,
  useMemo,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import type { Drill, PracticeNode, PracticeEdge } from "@/data/types";
import { getNodeGeometry } from "@/lib/node-geometry";

import { AddNodeButton } from "./add-node-button";
import { DrillPickerPopover } from "./drill-picker";
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
  transform: CanvasTransform;
  onTransformChange: (t: CanvasTransform) => void;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNode: (nodeId: string, updates: Partial<PracticeNode>) => void;
  onAddDrill: (afterNodeId: string, beforeNodeId: string, drill: Drill) => void;
  onAppendDrill: (drill: Drill) => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 2;
const ZOOM_SENSITIVITY = 0.001;
const DRAG_THRESHOLD = 4;

export function Canvas({
  nodes,
  edges,
  selectedNodeId,
  transform,
  onTransformChange,
  onSelectNode,
  onUpdateNode,
  onAddDrill,
  onAppendDrill,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan state (dragging empty canvas)
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node drag state
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({
    mouseX: 0,
    mouseY: 0,
    nodeX: 0,
    nodeY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // --- Node interactions: click to select, drag to reposition ---

  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: ReactMouseEvent) => {
      if (e.button !== 0) return;
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
    },
    [nodeMap],
  );

  // --- Canvas interactions: click to deselect, drag to pan ---

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      }
    },
    [transform.x, transform.y],
  );

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      // Node drag takes priority
      if (dragNodeId) {
        const dx = e.clientX - dragStart.mouseX;
        const dy = e.clientY - dragStart.mouseY;

        if (!isDragging && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
        setIsDragging(true);

        const newX = dragStart.nodeX + dx / transform.scale;
        const newY = dragStart.nodeY + dy / transform.scale;
        onUpdateNode(dragNodeId, { position: { x: newX, y: newY } });
        return;
      }

      // Canvas pan
      if (isPanning) {
        onTransformChange({
          ...transform,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [
      dragNodeId,
      dragStart,
      isDragging,
      isPanning,
      panStart,
      transform,
      onTransformChange,
      onUpdateNode,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (dragNodeId) {
      if (!isDragging) {
        onSelectNode(dragNodeId);
      }
      setDragNodeId(null);
      setIsDragging(false);
    }
    setIsPanning(false);
  }, [dragNodeId, isDragging, onSelectNode]);

  const handleWheel = useCallback(
    (e: ReactWheelEvent) => {
      e.preventDefault();

      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl + scroll → zoom toward cursor
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

        const scaleRatio = newScale / transform.scale;
        const newX = mouseX - (mouseX - transform.x) * scaleRatio;
        const newY = mouseY - (mouseY - transform.y) * scaleRatio;

        onTransformChange({ x: newX, y: newY, scale: newScale });
      } else {
        // Plain scroll → pan
        onTransformChange({
          ...transform,
          x: transform.x - e.deltaX,
          y: transform.y - e.deltaY,
        });
      }
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
        isNodeBeingDragged || isPanning ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      style={{
        backgroundImage: `radial-gradient(circle, oklch(var(--border)) 1px, transparent 1px)`,
        backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
    >
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
                transition:
                  beingDragged || isPanning
                    ? "none"
                    : "transform 0.2s ease-out",
                zIndex: beingDragged ? 50 : undefined,
              }}
              onMouseDown={(e) => {
                handleNodeMouseDown(node.id, e);
              }}
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

        {/* Append button at end of flow */}
        {!isNodeBeingDragged &&
          (() => {
            const sourceIds = new Set(edges.map((e) => e.source));
            const tailNodes = nodes.filter((n) => !sourceIds.has(n.id));
            return tailNodes.map((tail) => {
              const geo = getNodeGeometry(tail);
              const cx = geo.left + geo.width / 2;
              const ty = geo.top + geo.height + 30;
              return (
                <div
                  key={`append-${tail.id}`}
                  className="absolute left-0 top-0"
                  style={{ transform: `translate(${cx - 60}px, ${ty}px)` }}
                >
                  <DrillPickerPopover onSelect={onAppendDrill}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-dashed text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Plus strokeWidth={2} />
                      Add drill
                    </Button>
                  </DrillPickerPopover>
                </div>
              );
            });
          })()}
      </div>
    </div>
  );
}
