import type { PracticeNode, PracticeEdge } from "@/data/types";
import { getEdgeAnchors } from "@/lib/node-geometry";

interface WorkflowEdgeProps {
  edge: PracticeEdge;
  sourceNode: PracticeNode;
  targetNode: PracticeNode;
  isDropTarget?: boolean;
}

export function WorkflowEdge({
  edge,
  sourceNode,
  targetNode,
  isDropTarget,
}: WorkflowEdgeProps) {
  const { sx, sy, tx, ty, sourceSide, targetSide } = getEdgeAnchors(
    sourceNode,
    targetNode,
  );

  // Build a smooth bezier with control points that follow the exit/entry direction
  const dist = Math.max(
    Math.abs(tx - sx),
    Math.abs(ty - sy),
    40,
  );
  const offset = Math.min(dist * 0.5, 80);

  const cp1 = controlOffset(sx, sy, sourceSide, offset);
  const cp2 = controlOffset(tx, ty, targetSide, offset);

  const d = `M ${sx} ${sy} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tx} ${ty}`;

  // Arrow head pointing in the direction of entry
  const arrowPoints = arrowHead(tx, ty, targetSide);

  // Label position at curve midpoint
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  return (
    <g>
      {isDropTarget && (
        <path
          d={d}
          fill="none"
          stroke="oklch(var(--primary))"
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.2}
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={isDropTarget ? "oklch(var(--primary))" : "oklch(var(--border-strong))"}
        strokeWidth={isDropTarget ? 2 : 1.5}
      />
      <polygon
        points={arrowPoints}
        fill={isDropTarget ? "oklch(var(--primary))" : "oklch(var(--border-strong))"}
      />
      {edge.label && (
        <g>
          <rect
            x={midX - edge.label.length * 3.5 - 6}
            y={midY - 10}
            width={edge.label.length * 7 + 12}
            height={20}
            rx={10}
            fill="oklch(var(--background))"
            stroke="oklch(var(--border))"
            strokeWidth={1}
          />
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fill="oklch(var(--muted-foreground))"
            fontSize={11}
            fontWeight={500}
            fontFamily="var(--font-sans)"
          >
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
}

/** Returns a control point offset in the direction a side faces */
function controlOffset(
  x: number,
  y: number,
  side: "top" | "bottom" | "left" | "right",
  offset: number,
) {
  switch (side) {
    case "top":
      return { x, y: y - offset };
    case "bottom":
      return { x, y: y + offset };
    case "left":
      return { x: x - offset, y };
    case "right":
      return { x: x + offset, y };
  }
}

/** Returns arrow polygon points facing into the target side */
function arrowHead(
  x: number,
  y: number,
  side: "top" | "bottom" | "left" | "right",
): string {
  const s = 4; // half-width
  const l = 8; // length
  switch (side) {
    case "top":
      // Arrow pointing down into top
      return `${x},${y} ${x - s},${y - l} ${x + s},${y - l}`;
    case "bottom":
      // Arrow pointing up into bottom
      return `${x},${y} ${x - s},${y + l} ${x + s},${y + l}`;
    case "left":
      // Arrow pointing right into left
      return `${x},${y} ${x - l},${y - s} ${x - l},${y + s}`;
    case "right":
      // Arrow pointing left into right
      return `${x},${y} ${x + l},${y - s} ${x + l},${y + s}`;
  }
}
