import { Button } from "@laxdb/ui/components/ui/button";
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
    <div
      className="group/add absolute flex items-center justify-center"
      style={{
        left: cx - 20,
        top: cy - 20,
        width: 40,
        height: 40,
        zIndex: 10,
      }}
    >
      <Button
        variant="outline"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          onAdd(sourceNode.id, targetNode.id);
        }}
        className="rounded-full opacity-0 group-hover/add:opacity-100 transition-opacity shadow-sm"
      >
        <Plus strokeWidth={2.5} />
        <span className="sr-only">Add block</span>
      </Button>
    </div>
  );
}
