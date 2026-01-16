"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Post } from "content-collections";
import type { GraphNode } from "./graph-types";
import { useGraphData } from "./use-graph-data";

const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

interface KnowledgeGraphProps {
  readonly posts: readonly Post[];
  readonly onNodeClick?: (slug: string) => void;
  readonly width?: number;
  readonly height?: number;
}

// Node colors by type
const NODE_COLORS = {
  post: "#60a5fa", // blue-400
  tag: "#f472b6", // pink-400
} as const;

const NODE_COLORS_HIGHLIGHT = {
  post: "#93c5fd", // blue-300
  tag: "#f9a8d4", // pink-300
} as const;

const NODE_COLORS_DIM = {
  post: "#1e3a5f", // darker blue
  tag: "#5c1f3d", // darker pink
} as const;

export function KnowledgeGraph({ posts, onNodeClick, width, height }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: width ?? 800, height: height ?? 600 });
  const [mounted, setMounted] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const graphData = useGraphData(posts);

  // Build set of connected node IDs for hover highlighting
  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>([hoveredNode]);
    for (const link of graphData.links) {
      if (link.source === hoveredNode) connected.add(link.target);
      if (link.target === hoveredNode) connected.add(link.source);
    }
    return connected;
  }, [hoveredNode, graphData.links]);

  // Convert to mutable format for force-graph (memoized to prevent simulation reset on hover)
  const mutableGraphData = useMemo(
    () => ({
      nodes: graphData.nodes.map((n) => ({ ...n })),
      links: graphData.links.map((l) => ({ ...l })),
    }),
    [graphData],
  );

  // Handle responsive sizing
  useEffect(() => {
    setMounted(true);

    if (!width || !height) {
      const updateDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDimensions({
            width: width ?? rect.width,
            height: height ?? Math.min(rect.width * 0.75, 600),
          });
        }
      };

      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => {
        window.removeEventListener("resize", updateDimensions);
      };
    }
  }, [width, height]);

  const handleNodeClick = useCallback(
    (node: unknown) => {
      // oxlint-disable-next-line no-unsafe-type-assertion -- react-force-graph loses generic types with React.lazy
      const n = node as GraphNode;
      if (n.type === "post" && n.slug && onNodeClick) {
        onNodeClick(n.slug);
      }
    },
    [onNodeClick],
  );

  const handleNodeHover = useCallback((node: unknown) => {
    // oxlint-disable-next-line no-unsafe-type-assertion -- react-force-graph loses generic types with React.lazy
    const n = node as GraphNode | null;
    setHoveredNode(n?.id ?? null);
  }, []);

  const nodeCanvasObject = useCallback(
    (obj: unknown, ctx: CanvasRenderingContext2D) => {
      // oxlint-disable-next-line no-unsafe-type-assertion -- react-force-graph loses generic types with React.lazy
      const node = obj as GraphNode & { x?: number; y?: number };
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const baseSize = (node.size ?? 1) * 4;

      // Determine highlight state
      const isHovered = hoveredNode === node.id;
      const isConnected = connectedNodes.has(node.id);
      const isDimmed = hoveredNode !== null && !isConnected;

      // Get appropriate color
      let color: string;
      if (isHovered) {
        color = NODE_COLORS_HIGHLIGHT[node.type];
      } else if (isDimmed) {
        color = NODE_COLORS_DIM[node.type];
      } else {
        color = NODE_COLORS[node.type];
      }

      // Scale up hovered node
      const size = isHovered ? baseSize * 1.3 : baseSize;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw glow for hovered node
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, size + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw label (brighter for highlighted nodes)
      const label = node.label;
      const fontSize = node.type === "post" ? 10 : 8;
      ctx.font = `${isHovered ? "bold " : ""}${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isDimmed ? "#6b7280" : "#e5e7eb"; // gray-500 for dimmed, gray-200 otherwise
      ctx.fillText(label, x, y + size + fontSize);
    },
    [hoveredNode, connectedNodes],
  );

  const getLinkColor = useCallback(
    (obj: unknown) => {
      // oxlint-disable-next-line no-unsafe-type-assertion -- react-force-graph loses generic types with React.lazy
      const link = obj as { source: string | { id?: string }; target: string | { id?: string } };
      if (!hoveredNode) return "#4b5563"; // gray-600

      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;

      const isConnected = sourceId === hoveredNode || targetId === hoveredNode;

      return isConnected ? "#9ca3af" : "#1f2937"; // gray-400 for connected, gray-800 for dimmed
    },
    [hoveredNode],
  );

  const getLinkWidth = useCallback(
    (obj: unknown) => {
      // oxlint-disable-next-line no-unsafe-type-assertion -- react-force-graph loses generic types with React.lazy
      const link = obj as { source: string | { id?: string }; target: string | { id?: string } };
      if (!hoveredNode) return 1;

      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;

      const isConnected = sourceId === hoveredNode || targetId === hoveredNode;

      return isConnected ? 2 : 0.5;
    },
    [hoveredNode],
  );

  if (!mounted) {
    return (
      <div
        ref={containerRef}
        className="flex w-full items-center justify-center rounded-lg bg-gray-900/50"
        style={{ height: dimensions.height }}
      >
        <span className="text-gray-400">Loading graph...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-lg bg-gray-900/50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center" style={{ height: dimensions.height }}>
            <span className="text-gray-400">Loading graph...</span>
          </div>
        }
      >
        <ForceGraph2D
          graphData={mutableGraphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(obj: unknown, color: string, ctx: CanvasRenderingContext2D) => {
            // oxlint-disable-next-line no-unsafe-type-assertion -- react-force-graph loses generic types with React.lazy
            const node = obj as GraphNode & { x?: number; y?: number };
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const size = (node.size ?? 1) * 4;
            ctx.beginPath();
            ctx.arc(x, y, size + 5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          backgroundColor="transparent"
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </Suspense>
    </div>
  );
}
