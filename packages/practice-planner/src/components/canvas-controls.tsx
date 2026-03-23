import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@laxdb/ui/components/ui/toggle-group";
import {
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutGrid,
} from "lucide-react";

export type CanvasMode = "pointer" | "pan";

interface CanvasControlsProps {
  mode: CanvasMode;
  scale: number;
  onModeChange: (mode: CanvasMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onOrganize: () => void;
}

export function CanvasControls({
  mode,
  scale,
  onModeChange,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onOrganize,
}: CanvasControlsProps) {
  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl shadow-lg px-1.5 py-1">
      <ToggleGroup
        value={[mode]}
        onValueChange={(values) => {
          const next = values[0] as CanvasMode | undefined;
          if (next) onModeChange(next);
        }}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="pointer" title="Select (V)">
          <MousePointer2 />
        </ToggleGroupItem>
        <ToggleGroupItem value="pan" title="Pan (Space)">
          <Hand />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-5 mx-0.5" />

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <ZoomOut />
      </Button>
      <span className="px-1 text-[11px] font-medium text-muted-foreground tabular-nums min-w-[40px] text-center select-none">
        {Math.round(scale * 100)}%
      </span>
      <Button variant="ghost" size="icon-sm" onClick={onZoomIn} title="Zoom In">
        <ZoomIn />
      </Button>

      <Separator orientation="vertical" className="h-5 mx-0.5" />

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onZoomToFit}
        title="Zoom to Fit"
      >
        <Maximize />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onOrganize}
        title="Auto-Organize"
      >
        <LayoutGrid />
      </Button>
    </div>
  );
}
