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
import { getNodeGeometry } from "@/lib/node-geometry";

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
  onAddDrill: (afterNodeId: string, beforeNodeId: string, drill: Drill) => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 2;
const ZOOM_SENSITIVITY = 0.001;

export function Canvas({
  nodes,
  edges,
  selectedNodeId,
  mode,
  transform,
  onTransformChange,
  onSelectNode,
  onAddDrill,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);

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
      if (isPanning) {
        onTransformChange({
          ...transform,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart, transform, onTransformChange],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

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

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden ${
        shouldPan
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
                />
              );
            })}
          </g>
        </svg>

        {/* Add-between buttons */}
        {edges.map((edge) => {
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

          return (
            <div
              key={node.id}
              className="absolute left-0 top-0"
              style={{
                transform: `translate(${geo.left}px, ${geo.top}px)`,
                transition: isPanning
                  ? "none"
                  : "transform 0.2s ease-out",
              }}
            >
              <WorkflowNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={onSelectNode}
                scale={transform.scale}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
