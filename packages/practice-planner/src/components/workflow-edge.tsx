import type { PracticeNode, PracticeEdge } from "@/data/types";
import { getEdgeAnchors } from "@/lib/node-geometry";

interface WorkflowEdgeProps {
  edge: PracticeEdge;
  sourceNode: PracticeNode;
  targetNode: PracticeNode;
}

export function WorkflowEdge({
  edge,
  sourceNode,
  targetNode,
}: WorkflowEdgeProps) {
  const { sx, sy, tx, ty } = getEdgeAnchors(sourceNode, targetNode);

  const midY = (sy + ty) / 2;
  // Smooth cubic bezier curve
  const d = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="oklch(var(--border-strong))"
        strokeWidth={1.5}
      />
      {/* Arrow head */}
      <polygon
        points={`${tx},${ty} ${tx - 4},${ty - 8} ${tx + 4},${ty - 8}`}
        fill="oklch(var(--border-strong))"
      />
      {/* Edge label */}
      {edge.label && (
        <g>
          <rect
            x={(sx + tx) / 2 - edge.label.length * 3.5 - 6}
            y={midY - 10}
            width={edge.label.length * 7 + 12}
            height={20}
            rx={10}
            fill="oklch(var(--background))"
            stroke="oklch(var(--border))"
            strokeWidth={1}
          />
          <text
            x={(sx + tx) / 2}
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
