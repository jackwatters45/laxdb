import { RpcApiClient } from "@laxdb/api-v2/client";
import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";
import { Sparkles, Library, GitBranch, Settings } from "lucide-react";
import { useState, useCallback } from "react";

import { Canvas } from "@/components/canvas";
import { CanvasControls } from "@/components/canvas-controls";
import { ConfigPanel } from "@/components/config-panel";
import { DrillSidebar } from "@/components/drill-sidebar";
import { PracticeSettings } from "@/components/practice-settings";
import { QuickPlanModal } from "@/components/quick-plan-modal";
import { SplitNodeModal } from "@/components/split-node";
import { SAMPLE_PRACTICE } from "@/data/mock";
import { useCanvasControls } from "@/hooks/use-canvas-controls";
import { DrillsProvider } from "@/hooks/use-drills";
import { usePracticeEditor } from "@/hooks/use-practice-editor";
import { runApi } from "@/lib/api";
import { generateQuickPlan } from "@/lib/quick-plan";
import type { Drill, DrillCategory } from "@/types";

const loadDrills = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      return yield* client.DrillList();
    }),
  ),
);

export const Route = createFileRoute("/practice/$id")({
  component: PracticePlannerPage,
});

function PracticePlannerPage() {
  const { data: drills = [] } = useQuery({
    queryKey: ["drills"],
    queryFn: () => loadDrills(),
  });

  // Core editor state
  const editor = usePracticeEditor(SAMPLE_PRACTICE);
  const { practice, nodes, edges } = editor;

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drillSidebarOpen, setDrillSidebarOpen] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [quickPlanOpen, setQuickPlanOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  // Canvas transform
  const canvas = useCanvasControls({
    nodes,
    edges,
    sidebarOpen: drillSidebarOpen,
    panelOpen: !!selectedNode || settingsOpen,
    setPractice: editor.setPractice,
  });

  // Node selection helpers
  const openSettings = useCallback(() => {
    setSelectedNodeId(null);
    setSettingsOpen(true);
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) setSettingsOpen(false);
  }, []);

  // Wrap mutations that also affect selection
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      editor.deleteNode(nodeId);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [editor, selectedNodeId],
  );

  const handleAddDrillBetween = useCallback(
    (afterId: string, beforeId: string, drill: Drill) => {
      const newId = editor.addDrillBetween(afterId, beforeId, drill);
      if (newId) setSelectedNodeId(newId);
    },
    [editor],
  );

  const handleAddDrillFromSidebar = useCallback(
    (...args: Parameters<typeof editor.addDrillFromSidebar>) => {
      const newId = editor.addDrillFromSidebar(...args);
      if (newId) setSelectedNodeId(newId);
    },
    [editor],
  );

  const handleQuickGenerate = useCallback(
    (options: {
      durationMinutes: number;
      categories: DrillCategory[];
      includeWarmup: boolean;
      includeCooldown: boolean;
    }) => {
      const plan = generateQuickPlan(drills, options);
      editor.setPractice({
        ...practice,
        name: "Quick Practice Plan",
        durationMinutes: options.durationMinutes,
        nodes: plan.nodes,
        edges: plan.edges,
      });
      setSelectedNodeId(null);
      canvas.setTransform({ x: 500, y: 40, scale: 0.75 });
    },
    [drills, practice, editor, canvas],
  );

  // Derived
  const totalMinutes = nodes.reduce(
    (sum, n) => sum + (n.durationMinutes ?? 0),
    0,
  );
  const canvasNodes = nodes.filter((n) => n.variant !== "start");
  const canvasEdges = edges.filter((e) => {
    const startNode = nodes.find((n) => n.variant === "start");
    return (
      !startNode || (e.source !== startNode.id && e.target !== startNode.id)
    );
  });

  return (
    <DrillsProvider drills={drills}>
      <div className="flex h-dvh w-screen overflow-hidden bg-background">
        {/* Drill Sidebar (left) */}
        <DrillSidebar
          isOpen={drillSidebarOpen}
          onClose={() => {
            setDrillSidebarOpen(false);
          }}
          onAddDrill={handleAddDrillFromSidebar}
        />

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PlannerToolbar
            practice={practice}
            totalMinutes={totalMinutes}
            blockCount={canvasNodes.length}
            drillSidebarOpen={drillSidebarOpen}
            onToggleSidebar={() => {
              setDrillSidebarOpen((v) => !v);
            }}
            onOpenSettings={openSettings}
            onOpenSplit={() => {
              setSplitModalOpen(true);
            }}
            onOpenQuickPlan={() => {
              setQuickPlanOpen(true);
            }}
          />

          <div className="flex-1 overflow-hidden">
            <Canvas
              nodes={canvasNodes}
              edges={canvasEdges}
              selectedNodeId={selectedNodeId}
              transform={canvas.transform}
              onTransformChange={canvas.setTransform}
              onSelectNode={selectNode}
              onUpdateNode={editor.updateNode}
              onAddDrill={handleAddDrillBetween}
              onAppendDrill={editor.appendDrill}
            />
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
            <CanvasControls
              scale={canvas.transform.scale}
              onZoomIn={canvas.zoomIn}
              onZoomOut={canvas.zoomOut}
              onZoomToFit={canvas.zoomToFit}
              onOrganize={canvas.organize}
            />
          </div>
        </div>

        {/* Right panel */}
        {selectedNode && (
          <ConfigPanel
            node={selectedNode}
            onUpdate={editor.updateNode}
            onDelete={handleDeleteNode}
            onMove={editor.moveNodeInFlow}
            canMoveUp={canvasEdges.some((e) => e.target === selectedNode.id)}
            canMoveDown={canvasEdges.some((e) => e.source === selectedNode.id)}
            onClose={() => {
              selectNode(null);
            }}
          />
        )}
        {!selectedNode && settingsOpen && (
          <PracticeSettings
            practice={practice}
            totalMinutes={totalMinutes}
            blockCount={canvasNodes.length}
            onUpdate={editor.updatePractice}
            onClose={() => {
              setSettingsOpen(false);
            }}
          />
        )}

        {/* Modals */}
        <SplitNodeModal
          isOpen={splitModalOpen}
          onClose={() => {
            setSplitModalOpen(false);
          }}
          onConfirm={editor.addSplit}
        />
        <QuickPlanModal
          isOpen={quickPlanOpen}
          onClose={() => {
            setQuickPlanOpen(false);
          }}
          onGenerate={handleQuickGenerate}
        />
      </div>
    </DrillsProvider>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PlannerToolbar({
  practice,
  totalMinutes,
  blockCount,
  drillSidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  onOpenSplit,
  onOpenQuickPlan,
}: {
  practice: { name: string; durationMinutes: number | null };
  totalMinutes: number;
  blockCount: number;
  drillSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenSplit: () => void;
  onOpenQuickPlan: () => void;
}) {
  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-card flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant={drillSidebarOpen ? "default" : "outline"}
          onClick={onToggleSidebar}
        >
          <Library />
          Drills
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-accent transition-colors"
        >
          <h1 className="text-sm font-semibold text-foreground text-balance">
            {practice.name}
          </h1>
          <Settings className="size-3 text-muted-foreground" />
        </button>

        {practice.durationMinutes ? (
          <DurationIndicator
            actual={totalMinutes}
            target={practice.durationMinutes}
            blocks={blockCount}
          />
        ) : (
          <>
            <span className="text-xs text-muted-foreground tabular-nums">
              {totalMinutes} min
            </span>
            <span className="text-xs text-muted-foreground/50 tabular-nums">
              {blockCount} blocks
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onOpenSplit}>
          <GitBranch />
          Split
        </Button>
        <Button onClick={onOpenQuickPlan}>
          <Sparkles />
          Quick Plan
        </Button>
      </div>
    </header>
  );
}

function DurationIndicator({
  actual,
  target,
  blocks,
}: {
  actual: number;
  target: number;
  blocks: number;
}) {
  const pct = Math.min(Math.round((actual / target) * 100), 100);
  const over = actual > target;
  const diff = Math.abs(actual - target);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full ${over ? "bg-destructive" : "bg-foreground"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {actual}/{target} min
        </span>
      </div>
      {diff > 0 && (
        <span
          className={`text-[10px] tabular-nums ${over ? "text-destructive" : "text-muted-foreground/50"}`}
        >
          {over ? `+${diff}` : `-${diff}`}
        </span>
      )}
      <span className="text-xs text-muted-foreground/50 tabular-nums">
        {blocks} blocks
      </span>
    </div>
  );
}
