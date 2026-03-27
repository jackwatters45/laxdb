import { RpcApiClient } from "@laxdb/api-v2/client";
import {
  PracticeItemPriority as PracticeItemPrioritySchema,
  PracticeItemType as PracticeItemTypeSchema,
  PracticeItemVariant as PracticeItemVariantSchema,
  PracticeStatus as PracticeStatusSchema,
} from "@laxdb/core-v2/practice/practice.schema";
import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Sparkles, Library, GitBranch, Settings } from "lucide-react";
import { useState, useCallback, useMemo } from "react";

import { Canvas } from "@/components/canvas";
import { CanvasControls } from "@/components/canvas-controls";
import { ConfigPanel } from "@/components/config-panel";
import { DrillSidebar } from "@/components/drill-sidebar";
import { PracticeSettings } from "@/components/practice-settings";
import { QuickPlanModal } from "@/components/quick-plan-modal";
import { SplitNodeModal } from "@/components/split-node";
import { useCanvasControls } from "@/hooks/use-canvas-controls";
import { DrillsProvider } from "@/hooks/use-drills";
import { usePracticeEditor } from "@/hooks/use-practice-editor";
import { usePracticePersistence } from "@/hooks/use-practice-persistence";
import { runApi } from "@/lib/api";
import { fromDb } from "@/lib/practice-mapper";
import { generateQuickPlan } from "@/lib/quick-plan";
import type { Drill, DrillCategory, PracticeNode } from "@/types";

const loadDrills = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      return yield* client.DrillList();
    }),
  ),
);

const SaveItemFields = {
  type: PracticeItemTypeSchema,
  variant: Schema.optional(PracticeItemVariantSchema),
  drillPublicId: Schema.optional(Schema.NullOr(Schema.String)),
  label: Schema.optional(Schema.NullOr(Schema.String)),
  durationMinutes: Schema.optional(Schema.NullOr(Schema.Number)),
  notes: Schema.optional(Schema.NullOr(Schema.String)),
  groups: Schema.optional(Schema.Array(Schema.String)),
  orderIndex: Schema.optional(Schema.Number),
  positionX: Schema.optional(Schema.NullOr(Schema.Number)),
  positionY: Schema.optional(Schema.NullOr(Schema.Number)),
  priority: Schema.optional(PracticeItemPrioritySchema),
};

const SavePracticeInput = Schema.Struct({
  practiceId: Schema.String,
  practice: Schema.Struct({
    name: Schema.String,
    date: Schema.NullOr(Schema.String),
    description: Schema.NullOr(Schema.String),
    notes: Schema.NullOr(Schema.String),
    durationMinutes: Schema.NullOr(Schema.Number),
    location: Schema.NullOr(Schema.String),
    status: PracticeStatusSchema,
  }),
  addedItems: Schema.Array(Schema.Struct(SaveItemFields)),
  updatedItems: Schema.Array(
    Schema.Struct({ publicId: Schema.String, ...SaveItemFields }),
  ),
  removedItemIds: Schema.Array(Schema.String),
  orderedIds: Schema.Array(Schema.String),
});

const savePractice = createServerFn({ method: "POST" })
  .inputValidator((data: typeof SavePracticeInput.Type) =>
    Schema.decodeSync(SavePracticeInput)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;

        // Update practice metadata
        yield* client.PracticeUpdate({
          publicId: data.practiceId,
          name: data.practice.name,
          date: data.practice.date ? new Date(data.practice.date) : undefined,
          description: data.practice.description,
          notes: data.practice.notes,
          durationMinutes: data.practice.durationMinutes,
          location: data.practice.location,
        });

        // Remove deleted items
        for (const id of data.removedItemIds) {
          yield* client.PracticeRemoveItem({ publicId: id });
        }

        // Add new items
        for (const item of data.addedItems) {
          yield* client.PracticeAddItem({
            practicePublicId: data.practiceId,
            ...item,
          });
        }

        // Update existing items
        for (const item of data.updatedItems) {
          yield* client.PracticeUpdateItem(item);
        }
      }),
    ),
  );

const loadPractice = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const [practice, items] = yield* Effect.all([
          client.PracticeGet({ publicId: data.id }),
          client.PracticeListItems({ practicePublicId: data.id }),
        ]);
        return { practice, items };
      }),
    ),
  );

export const Route = createFileRoute("/practice/$id")({
  component: PracticePlannerPage,
  loader: ({ params }) => loadPractice({ data: { id: params.id } }),
});

function PracticePlannerPage() {
  const { practice: dbPractice, items: dbItems } = Route.useLoaderData();

  const { data: drills = [] } = useQuery({
    queryKey: ["drills"],
    queryFn: () => loadDrills(),
  });

  // Convert DB data to canvas graph
  const initialGraph = useMemo(
    () => fromDb(dbPractice, dbItems),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
    [],
  );

  // Core editor state
  const editor = usePracticeEditor(initialGraph);
  const { practice, nodes, edges } = editor;

  // Auto-save
  const { saving, lastSaved } = usePracticePersistence({
    practice,
    initialNodes: initialGraph.nodes,
    buildPayload: (current, knownIds) => {
      const nodeToItem = (n: PracticeNode) => ({
        type: n.type,
        variant: n.variant === "start" ? ("default" as const) : n.variant,
        drillPublicId: n.drillId,
        label: n.label,
        durationMinutes: n.durationMinutes,
        notes: n.notes,
        groups: [...n.groups],
        positionX: Math.round(n.position.x),
        positionY: Math.round(n.position.y),
        priority: n.priority,
      });

      return {
        practiceId: current.id,
        practice: {
          name: current.name,
          date: current.date,
          description: current.description,
          notes: current.notes,
          durationMinutes: current.durationMinutes,
          location: current.location,
          status: current.status,
        },
        addedItems: current.nodes
          .filter((n) => !knownIds.has(n.id))
          .map((n, i) => ({ ...nodeToItem(n), orderIndex: i })),
        updatedItems: current.nodes
          .filter((n) => knownIds.has(n.id))
          .map((n, i) => ({ publicId: n.id, ...nodeToItem(n), orderIndex: i })),
        removedItemIds: [...knownIds].filter(
          (id) => !current.nodes.some((n) => n.id === id),
        ),
        orderedIds: current.nodes
          .filter((n) => knownIds.has(n.id))
          .map((n) => n.id),
      };
    },
    onSave: (payload) => savePractice({ data: payload }),
  });

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
            saving={saving}
            lastSaved={lastSaved}
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
  saving,
  lastSaved,
  drillSidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  onOpenSplit,
  onOpenQuickPlan,
}: {
  practice: { name: string; durationMinutes: number | null };
  totalMinutes: number;
  blockCount: number;
  saving: boolean;
  lastSaved: Date | null;
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
        <span className="text-[11px] text-muted-foreground/50">
          {saving
            ? "Saving…"
            : lastSaved
              ? `Saved ${lastSaved.toLocaleTimeString()}`
              : ""}
        </span>
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
