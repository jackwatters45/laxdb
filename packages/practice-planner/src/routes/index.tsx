import { Button } from "@laxdb/ui/components/ui/button";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Library, GitBranch, Settings } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

import { Canvas } from "@/components/canvas";
import { CanvasControls } from "@/components/canvas-controls";
import { ConfigPanel } from "@/components/config-panel";
import { DrillSidebar } from "@/components/drill-sidebar";
import { PracticeSettings } from "@/components/practice-settings";
import { QuickPlanModal } from "@/components/quick-plan-modal";
import { SplitNodeModal } from "@/components/split-node";
import { SAMPLE_PRACTICE } from "@/data/sample-practice";
import type {
  PracticeNode,
  PracticeEdge,
  Practice,
  PracticeItemType,
  Drill,
  DrillCategory,
} from "@/data/types";
import { autoLayout } from "@/lib/layout";
import { generateQuickPlan } from "@/lib/quick-plan";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function HomePage() {
  // Practice state with undo/redo
  const [practice, setPracticeRaw] = useState<Practice>(SAMPLE_PRACTICE);
  const undoStack = useRef<Practice[]>([]);
  const redoStack = useRef<Practice[]>([]);
  const { nodes, edges } = practice;

  const setPractice = useCallback((updater: Practice | ((prev: Practice) => Practice)) => {
    setPracticeRaw((prev) => {
      undoStack.current.push(prev);
      if (undoStack.current.length > 50) undoStack.current.shift();
      redoStack.current = [];
      return typeof updater === "function" ? updater(prev) : updater;
    });
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev) {
      setPracticeRaw((current) => {
        redoStack.current.push(current);
        return prev;
      });
    }
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (next) {
      setPracticeRaw((current) => {
        undoStack.current.push(current);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) { redo(); } else { undo(); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [undo, redo]);

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [transform, setTransform] = useState({ x: 500, y: 40, scale: 0.75 });
  const [drillSidebarOpen, setDrillSidebarOpen] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [quickPlanOpen, setQuickPlanOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  // Deselect node when opening settings, close settings when selecting a node
  const openSettings = useCallback(() => {
    setSelectedNodeId(null);
    setSettingsOpen(true);
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) setSettingsOpen(false);
  }, []);

  // Total duration
  const totalMinutes = nodes.reduce(
    (sum, n) => sum + (n.durationMinutes ?? 0),
    0,
  );

  // ---- Mutations ----

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<PracticeNode>) => {
      setPractice((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n,
        ),
      }));
    },
    [],
  );

  const updatePractice = useCallback(
    (updates: Partial<Practice>) => {
      setPractice((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setPractice((prev) => {
        // Find edges connected to this node
        const incomingEdges = prev.edges.filter((e) => e.target === nodeId);
        const outgoingEdges = prev.edges.filter((e) => e.source === nodeId);

        // Remove old edges
        let newEdges = prev.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        );

        // Reconnect: each incoming source connects to each outgoing target
        for (const ie of incomingEdges) {
          for (const oe of outgoingEdges) {
            newEdges.push({
              id: nextId("edge"),
              source: ie.source,
              target: oe.target,
            });
          }
        }

        return {
          ...prev,
          nodes: prev.nodes.filter((n) => n.id !== nodeId),
          edges: newEdges,
        };
      });
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId],
  );

  const moveNodeInFlow = useCallback(
    (nodeId: string, direction: "up" | "down") => {
      setPractice((prev) => {
        // Find the sibling to swap with
        const siblingEdge = direction === "up"
          ? prev.edges.find((e) => e.target === nodeId)
          : prev.edges.find((e) => e.source === nodeId);
        if (!siblingEdge) return prev;

        const siblingId = direction === "up" ? siblingEdge.source : siblingEdge.target;
        // Don't swap with Start node
        const sibling = prev.nodes.find((n) => n.id === siblingId);
        if (!sibling || sibling.variant === "start") return prev;

        // Swap positions
        const node = prev.nodes.find((n) => n.id === nodeId);
        if (!node) return prev;

        const newNodes = prev.nodes.map((n) => {
          if (n.id === nodeId) return { ...n, position: sibling.position };
          if (n.id === siblingId) return { ...n, position: node.position };
          return n;
        });

        // Swap edges: rewire so graph order matches visual order
        // Before (up): ...→ sibling → node → ...
        // After (up):  ...→ node → sibling → ...
        const newEdges = prev.edges.map((e) => {
          let source = e.source;
          let target = e.target;
          // Swap all references between the two nodes
          if (source === nodeId) source = siblingId;
          else if (source === siblingId) source = nodeId;
          if (target === nodeId) target = siblingId;
          else if (target === siblingId) target = nodeId;
          return source === e.source && target === e.target
            ? e
            : { ...e, source, target };
        });

        return { ...prev, nodes: newNodes, edges: newEdges };
      });
    },
    [],
  );

  const addDrillBetween = useCallback(
    (afterId: string, beforeId: string, drill: Drill) => {
      const afterNode = nodes.find((n) => n.id === afterId);
      const beforeNode = nodes.find((n) => n.id === beforeId);
      if (!afterNode || !beforeNode) return;

      const drillType: PracticeItemType = drill.tags.includes("warmup")
        ? "warmup"
        : drill.tags.includes("cooldown")
          ? "cooldown"
          : "drill";

      const newNode: PracticeNode = {
        id: nextId("node"),
        type: drillType,
        variant: "default",
        drillId: drill.id,
        label: drill.name,
        durationMinutes: drill.durationMinutes,
        notes: drill.subtitle,
        groups: ["all"],
        priority: "optional",
        position: {
          x: (afterNode.position.x + beforeNode.position.x) / 2,
          y: (afterNode.position.y + beforeNode.position.y) / 2,
        },
      };

      setPractice((prev) => {
        // Remove edge between after and before
        const newEdges = prev.edges.filter(
          (e) => !(e.source === afterId && e.target === beforeId),
        );
        // Add edges: after -> new -> before
        newEdges.push({
          id: nextId("edge"),
          source: afterId,
          target: newNode.id,
        });
        newEdges.push({
          id: nextId("edge"),
          source: newNode.id,
          target: beforeId,
        });

        return {
          ...prev,
          nodes: [...prev.nodes, newNode],
          edges: newEdges,
        };
      });

      setSelectedNodeId(newNode.id);
    },
    [nodes],
  );

  const addDrillFromSidebar = useCallback(
    (drill: Drill, type: PracticeItemType) => {
      // Find the last node (node with no outgoing edges)
      const sourcesSet = new Set(edges.map((e) => e.source));
      const lastNode = nodes.find((n) => !sourcesSet.has(n.id));
      const afterNode = lastNode ?? nodes.at(-1);

      if (!afterNode) return;

      const newNode: PracticeNode = {
        id: nextId("node"),
        type,
        variant: "default",
        drillId: drill.id,
        label: drill.name,
        durationMinutes: drill.durationMinutes,
        notes: drill.subtitle,
        groups: ["all"],
        priority: "optional",
        position: {
          x: afterNode.position.x,
          y: afterNode.position.y + 140,
        },
      };

      setPractice((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
        edges: [
          ...prev.edges,
          {
            id: nextId("edge"),
            source: afterNode.id,
            target: newNode.id,
          },
        ],
      }));

      setSelectedNodeId(newNode.id);
    },
    [nodes, edges],
  );

  const appendDrill = useCallback(
    (drill: Drill) => {
      const type: PracticeItemType = drill.tags.includes("warmup")
        ? "warmup"
        : drill.tags.includes("cooldown")
          ? "cooldown"
          : "drill";
      addDrillFromSidebar(drill, type);
    },
    [addDrillFromSidebar],
  );

  const handleSplitCreate = useCallback(
    (groups: string[]) => {
      // Find the last node without outgoing edges
      const sourcesSet = new Set(edges.map((e) => e.source));
      const tailNodes = nodes.filter((n) => !sourcesSet.has(n.id));
      const lastNode = tailNodes.at(-1) ?? nodes.at(-1);
      if (!lastNode) return;

      const splitNode: PracticeNode = {
        id: nextId("node"),
        type: "activity",
        variant: "split",
        drillId: null,
        label: "Group Split",
        durationMinutes: null,
        notes: `Split into: ${groups.join(", ")}`,
        groups: ["all"],
        priority: "required",
        position: {
          x: lastNode.position.x,
          y: lastNode.position.y + 140,
        },
      };

      const newNodes: PracticeNode[] = [splitNode];
      const newEdges: PracticeEdge[] = [
        {
          id: nextId("edge"),
          source: lastNode.id,
          target: splitNode.id,
        },
      ];

      // Create a placeholder node for each group
      const laneWidth = 280;
      const totalWidth = groups.length * laneWidth;
      const startX = splitNode.position.x - totalWidth / 2 + laneWidth / 2;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (!group) continue;
        const laneNode: PracticeNode = {
          id: nextId("node"),
          type: "drill",
          variant: "default",
          drillId: null,
          label: `${group} Drill`,
          durationMinutes: 15,
          notes: null,
          groups: [group],
          priority: "optional",
          position: {
            x: startX + i * laneWidth - 130 + 130,
            y: splitNode.position.y + 160,
          },
        };
        newNodes.push(laneNode);
        newEdges.push({
          id: nextId("edge"),
          source: splitNode.id,
          target: laneNode.id,
          label: group,
        });
      }

      setPractice((prev) => ({
        ...prev,
        nodes: [...prev.nodes, ...newNodes],
        edges: [...prev.edges, ...newEdges],
      }));
    },
    [nodes, edges],
  );

  const handleQuickGenerate = useCallback(
    (options: {
      durationMinutes: number;
      categories: DrillCategory[];
      includeWarmup: boolean;
      includeCooldown: boolean;
    }) => {
      const plan = generateQuickPlan(options);
      setPractice({
        ...practice,
        name: "Quick Practice Plan",
        durationMinutes: options.durationMinutes,
        nodes: plan.nodes,
        edges: plan.edges,
      });
      setSelectedNodeId(null);

      // Auto-center on the new plan
      setTransform({ x: 500, y: 40, scale: 0.75 });
    },
    [practice],
  );

  const handleOrganize = useCallback(() => {
    const result = autoLayout(nodes, edges);
    setPractice((prev) => ({
      ...prev,
      nodes: result.nodes,
    }));
  }, [nodes, edges]);

  const handleZoomToFit = useCallback(() => {
    if (nodes.length === 0) return;
    const minX = Math.min(...nodes.map((n) => n.position.x));
    const maxX = Math.max(...nodes.map((n) => n.position.x)) + 260;
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxY = Math.max(...nodes.map((n) => n.position.y)) + 100;

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const viewW =
      window.innerWidth -
      (drillSidebarOpen ? 300 : 0) -
      (selectedNode ? 340 : 0);
    const viewH = window.innerHeight;

    const scaleX = (viewW - 100) / contentW;
    const scaleY = (viewH - 100) / contentH;
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.5);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    setTransform({
      x: viewW / 2 - cx * scale + (drillSidebarOpen ? 150 : 0),
      y: viewH / 2 - cy * scale,
      scale,
    });
  }, [nodes, drillSidebarOpen, selectedNode]);

  const handleZoomIn = useCallback(() => {
    setTransform((t) => ({
      ...t,
      scale: Math.min(2, t.scale * 1.2),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform((t) => ({
      ...t,
      scale: Math.max(0.25, t.scale / 1.2),
    }));
  }, []);

  // Keyboard shortcuts
  // (Delete is handled via onKeyDown in parent — but we'll also catch it here)

  // Filter out Start node from canvas — practice details are in the settings panel
  const canvasNodes = nodes.filter((n) => n.variant !== "start");
  const canvasEdges = edges.filter((e) => {
    const startNode = nodes.find((n) => n.variant === "start");
    if (!startNode) return true;
    return e.source !== startNode.id && e.target !== startNode.id;
  });

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-background">
      {/* Drill Sidebar (left) */}
      <DrillSidebar
        isOpen={drillSidebarOpen}
        onClose={() => { setDrillSidebarOpen(false); }}
        onAddDrill={addDrillFromSidebar}
      />

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-card flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant={drillSidebarOpen ? "default" : "outline"}
              onClick={() => { setDrillSidebarOpen((v) => !v); }}
            >
              <Library />
              Drills
            </Button>

            <Separator orientation="vertical" className="h-5" />

            <button
              onClick={openSettings}
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
                blocks={canvasNodes.length}
              />
            ) : (
              <>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totalMinutes} min
                </span>
                <span className="text-xs text-muted-foreground/50 tabular-nums">
                  {canvasNodes.length} blocks
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setSplitModalOpen(true); }}>
              <GitBranch />
              Split
            </Button>
            <Button onClick={() => { setQuickPlanOpen(true); }}>
              <Sparkles />
              Quick Plan
            </Button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <Canvas
            nodes={canvasNodes}
            edges={canvasEdges}
            selectedNodeId={selectedNodeId}
            transform={transform}
            onTransformChange={setTransform}
            onSelectNode={selectNode}
            onUpdateNode={updateNode}
            onAddDrill={addDrillBetween}
            onAppendDrill={appendDrill}
          />
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
          <CanvasControls
            scale={transform.scale}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomToFit={handleZoomToFit}
            onOrganize={handleOrganize}
          />
        </div>
      </div>

      {/* Right panel — node config or practice settings */}
      {selectedNode && (
        <ConfigPanel
          node={selectedNode}
          onUpdate={updateNode}
          onDelete={deleteNode}
          onMove={moveNodeInFlow}
          canMoveUp={(() => {
            const incoming = canvasEdges.find((e) => e.target === selectedNode.id);
            return !!incoming;
          })()}
          canMoveDown={canvasEdges.some((e) => e.source === selectedNode.id)}
          onClose={() => { selectNode(null); }}
        />
      )}
      {!selectedNode && settingsOpen && (
        <PracticeSettings
          practice={practice}
          totalMinutes={totalMinutes}
          blockCount={canvasNodes.length}
          onUpdate={updatePractice}
          onClose={() => { setSettingsOpen(false); }}
        />
      )}

      {/* Modals */}
      <SplitNodeModal
        isOpen={splitModalOpen}
        onClose={() => { setSplitModalOpen(false); }}
        onConfirm={handleSplitCreate}
      />
      <QuickPlanModal
        isOpen={quickPlanOpen}
        onClose={() => { setQuickPlanOpen(false); }}
        onGenerate={handleQuickGenerate}
      />
    </div>
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
        <span className={`text-[10px] tabular-nums ${over ? "text-destructive" : "text-muted-foreground/50"}`}>
          {over ? `+${diff}` : `-${diff}`}
        </span>
      )}
      <span className="text-xs text-muted-foreground/50 tabular-nums">
        {blocks} blocks
      </span>
    </div>
  );
}
