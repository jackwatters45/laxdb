import { Button } from "@laxdb/ui/components/ui/button";
import { Plus } from "lucide-react";

import type { Drill, PracticeNode } from "@/data/types";
import { getEdgeAnchors } from "@/lib/node-geometry";

import { DrillPickerPopover } from "./drill-picker";

interface AddNodeButtonProps {
  sourceNode: PracticeNode;
  targetNode: PracticeNode;
  onAddDrill: (
    afterNodeId: string,
    beforeNodeId: string,
    drill: Drill,
  ) => void;
}

export function AddNodeButton({
  sourceNode,
  targetNode,
  onAddDrill,
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
      <DrillPickerPopover
        onSelect={(drill) => {
          onAddDrill(sourceNode.id, targetNode.id, drill);
        }}
      >
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-full opacity-0 group-hover/add:opacity-100 transition-opacity shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Plus strokeWidth={2.5} />
          <span className="sr-only">Add drill</span>
        </Button>
      </DrillPickerPopover>
    </div>
  );
}
