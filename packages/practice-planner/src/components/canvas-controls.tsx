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
    <div className="flex items-center gap-0.5 bg-card border border-border rounded-xl shadow-lg px-1.5 py-1">
      {/* Mode toggles */}
      <ControlButton
        active={mode === "pointer"}
        onClick={() => {
          onModeChange("pointer");
        }}
        title="Select (V)"
      >
        <MousePointer2 size={15} />
      </ControlButton>
      <ControlButton
        active={mode === "pan"}
        onClick={() => {
          onModeChange("pan");
        }}
        title="Pan (Space)"
      >
        <Hand size={15} />
      </ControlButton>

      <Divider />

      {/* Zoom */}
      <ControlButton onClick={onZoomOut} title="Zoom Out">
        <ZoomOut size={15} />
      </ControlButton>
      <span className="px-2 text-[11px] font-medium text-muted-foreground tabular-nums min-w-[40px] text-center select-none">
        {Math.round(scale * 100)}%
      </span>
      <ControlButton onClick={onZoomIn} title="Zoom In">
        <ZoomIn size={15} />
      </ControlButton>

      <Divider />

      {/* Fit & Organize */}
      <ControlButton onClick={onZoomToFit} title="Zoom to Fit">
        <Maximize size={15} />
      </ControlButton>
      <ControlButton onClick={onOrganize} title="Auto-Organize">
        <LayoutGrid size={15} />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        flex items-center justify-center
        w-8 h-8 rounded-lg
        transition-all duration-150
        ${
          active
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}
