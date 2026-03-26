import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { ZoomIn, ZoomOut, Maximize, LayoutGrid } from "lucide-react";

interface CanvasControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onOrganize: () => void;
}

export function CanvasControls({
  scale,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onOrganize,
}: CanvasControlsProps) {
  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl shadow-md px-2 py-1.5">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Zoom out"
        onClick={onZoomOut}
      >
        <ZoomOut />
      </Button>
      <span className="px-1.5 text-xs text-muted-foreground tabular-nums min-w-12 text-center select-none">
        {Math.round(scale * 100)}%
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Zoom in"
        onClick={onZoomIn}
      >
        <ZoomIn />
      </Button>

      <Separator orientation="vertical" className="h-5 mx-0.5" />

      <Button
        variant="ghost"
        size="icon"
        aria-label="Zoom to fit"
        onClick={onZoomToFit}
      >
        <Maximize />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Auto-organize"
        onClick={onOrganize}
      >
        <LayoutGrid />
      </Button>
    </div>
  );
}
