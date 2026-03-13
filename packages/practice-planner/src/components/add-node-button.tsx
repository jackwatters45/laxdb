import { Plus } from "lucide-react";

import type { PracticeNode } from "@/data/types";
import { getEdgeAnchors } from "@/lib/node-geometry";

interface AddNodeButtonProps {
  sourceNode: PracticeNode;
  targetNode: PracticeNode;
  onAdd: (afterNodeId: string, beforeNodeId: string) => void;
}

export function AddNodeButton({
  sourceNode,
  targetNode,
  onAdd,
}: AddNodeButtonProps) {
  const { sx, sy, tx, ty } = getEdgeAnchors(sourceNode, targetNode);

  const cx = (sx + tx) / 2;
  const cy = (sy + ty) / 2;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAdd(sourceNode.id, targetNode.id);
      }}
      className="group/add"
      style={{
        position: "absolute",
        left: cx - 20,
        top: cy - 20,
        width: 40,
        height: 40,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      <div
        className="
          flex items-center justify-center
          w-7 h-7 rounded-full
          bg-background border border-border
          text-muted-foreground
          opacity-0 group-hover/add:opacity-100
          hover:bg-foreground hover:text-background hover:border-foreground
          transition-all duration-200
          shadow-sm hover:shadow-md
          hover:scale-110
        "
      >
        <Plus size={14} strokeWidth={2.5} />
      </div>
    </button>
  );
}
