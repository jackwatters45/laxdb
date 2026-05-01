import { useState, useCallback } from "react";

import { autoLayout } from "@/lib/layout";
import type { PracticeNode, PracticeEdge, PracticeGraph } from "@/types";

interface UseCanvasControlsOptions {
  nodes: PracticeNode[];
  edges: PracticeEdge[];
  sidebarOpen: boolean;
  panelOpen: boolean;
  setPractice: (updater: (prev: PracticeGraph) => PracticeGraph) => void;
}

export function useCanvasControls({
  nodes,
  edges,
  sidebarOpen,
  panelOpen,
  setPractice,
}: UseCanvasControlsOptions) {
  const [transform, setTransform] = useState({
    x: 500,
    y: 40,
    scale: 0.75,
  });

  const zoomIn = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.min(2, t.scale * 1.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.max(0.25, t.scale / 1.2) }));
  }, []);

  const zoomToFit = useCallback(() => {
    if (nodes.length === 0) return;

    const minX = Math.min(...nodes.map((n) => n.position.x));
    const maxX = Math.max(...nodes.map((n) => n.position.x)) + 260;
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxY = Math.max(...nodes.map((n) => n.position.y)) + 100;

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const viewW =
      window.innerWidth - (sidebarOpen ? 300 : 0) - (panelOpen ? 340 : 0);
    const viewH = window.innerHeight;

    const scaleX = (viewW - 100) / contentW;
    const scaleY = (viewH - 100) / contentH;
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.5);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    setTransform({
      x: viewW / 2 - cx * scale + (sidebarOpen ? 150 : 0),
      y: viewH / 2 - cy * scale,
      scale,
    });
  }, [nodes, sidebarOpen, panelOpen]);

  const organize = useCallback(() => {
    const result = autoLayout(nodes, edges);
    setPractice((prev) => ({ ...prev, nodes: result.nodes }));
  }, [nodes, edges, setPractice]);

  return {
    transform,
    setTransform,
    zoomIn,
    zoomOut,
    zoomToFit,
    organize,
  };
}
