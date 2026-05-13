import { Button } from "@laxdb/ui/components/ui/button";
import { Plus } from "lucide-react";
import { useRef, useMemo } from "react";

import {
  useCanvasInteractions,
  type CanvasTransform,
} from "@/hooks/use-canvas-interactions";
import { getNodeGeometry } from "@/lib/node-geometry";
import type { Drill, PracticeNode, PracticeEdge } from "@/types";

import { AddNodeButton } from "./add-node-button";
import { DrillPickerPopover } from "./drill-picker";
import { WorkflowEdge } from "./workflow-edge";
import { WorkflowNode } from "./workflow-node";

interface CanvasProps {
  nodes: PracticeNode[];
  edges: PracticeEdge[];
  selectedNodeId: string | null;
  transform: CanvasTransform;
  onTransformChange: (t: CanvasTransform) => void;
  onSelectNode: (nodeId: string | null) => void;
  onDragNode: (
    nodeId: string,
    updates: { position: { x: number; y: number } },
  ) => void;
  onDragEnd: (
    nodeId: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => void;
  onAddDrill: (afterNodeId: string, beforeNodeId: string, drill: Drill) => void;
  onAppendDrill: (drill: Drill) => void;
}

export function Canvas({
  nodes,
  edges,
  selectedNodeId,
  transform,
  onTransformChange,
  onSelectNode,
  onDragNode,
  onDragEnd,
  onAddDrill,
  onAppendDrill,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    nodeMap,
    dragNodeId,
    isDragging,
    isNodeBeingDragged,
    isPanning,
    handlers,
    handleNodeMouseDown,
  } = useCanvasInteractions({
    nodes,
    transform,
    onTransformChange,
    onSelectNode,
    onDragNode,
    onDragEnd,
    containerRef,
  });

  const svgBounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, w: 100, h: 100 };
    let maxX = -Infinity;
    let maxY = -Infinity;
    let minX = Infinity;
    let minY = Infinity;
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
      className={`relative w-full h-full overflow-hidden ${
        isNodeBeingDragged || isPanning ? "cursor-grabbing" : "cursor-grab"
      }`}
      {...handlers}
      style={{
        backgroundImage:
          "radial-gradient(circle, oklch(var(--border)) 1px, transparent 1px)",
        backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
    >
      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/80 px-6 py-5 text-center shadow-sm backdrop-blur">
            <p className="text-sm font-medium text-foreground">
              Start with your first drill
            </p>
            <p className="max-w-xs text-xs text-muted-foreground text-pretty">
              Add a drill from your library or generate a quick plan to build
              the practice structure.
            </p>
            <DrillPickerPopover onSelect={onAppendDrill}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Plus strokeWidth={2} />
                Add first drill
              </Button>
            </DrillPickerPopover>
          </div>
        </div>
      ) : null}

      <div
        data-canvas="true"
        className="origin-top-left"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
        onClick={handlers.onClick}
      >
        {/* SVG edges */}
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

        {/* Nodes */}
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

        {/* Append buttons at tail nodes */}
        {!isNodeBeingDragged &&
          (() => {
            const sourceIds = new Set(edges.map((e) => e.source));
            return nodes
              .filter((n) => !sourceIds.has(n.id))
              .map((tail) => {
                const geo = getNodeGeometry(tail);
                const cx = geo.left + geo.width / 2;
                const ty = geo.top + geo.height + 30;
                return (
                  <div
                    key={`append-${tail.id}`}
                    className="absolute left-0 top-0"
                    style={{
                      transform: `translate(${cx - 60}px, ${ty}px)`,
                    }}
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
