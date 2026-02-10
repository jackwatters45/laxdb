import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { useCallback, useEffect, useRef, useState } from "react";

import { buildGraphData, NODE_COLORS, type GraphNode } from "@/lib/graph-utils";

export const Route = createFileRoute("/graph/")({
  component: GraphPage,
});

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function GraphPage() {
  const navigate = useNavigate();
  const graphData = buildGraphData(allPosts);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize positions
  useEffect(() => {
    const newPositions = new Map<string, NodePosition>();
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    graphData.nodes.forEach((node, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      newPositions.set(node.id, {
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      });
    });

    setPositions(newPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- graphData is derived from static allPosts
  }, [graphData.nodes.length, dimensions]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Force simulation
  useEffect(() => {
    if (positions.size === 0) return;

    const simulate = () => {
      setPositions((prev) => {
        const next = new Map(prev);
        const { width, height } = dimensions;

        // Apply forces
        graphData.nodes.forEach((node) => {
          const pos = next.get(node.id);
          if (!pos || (isDragging && draggedNode === node.id)) return;

          let fx = 0;
          let fy = 0;

          // Repulsion from other nodes
          graphData.nodes.forEach((other) => {
            if (other.id === node.id) return;
            const otherPos = next.get(other.id);
            if (!otherPos) return;

            const dx = pos.x - otherPos.x;
            const dy = pos.y - otherPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 5000 / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          });

          // Attraction along edges
          graphData.edges.forEach((edge) => {
            let otherPos: NodePosition | undefined;
            if (edge.source === node.id) {
              otherPos = next.get(edge.target);
            } else if (edge.target === node.id) {
              otherPos = next.get(edge.source);
            }
            if (!otherPos) return;

            const dx = otherPos.x - pos.x;
            const dy = otherPos.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = dist * 0.01;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          });

          // Center gravity
          const centerX = width / 2;
          const centerY = height / 2;
          fx += (centerX - pos.x) * 0.001;
          fy += (centerY - pos.y) * 0.001;

          // Apply velocity with damping
          pos.vx = (pos.vx + fx) * 0.9;
          pos.vy = (pos.vy + fy) * 0.9;
          pos.x += pos.vx;
          pos.y += pos.vy;

          // Bounds
          pos.x = Math.max(50, Math.min(width - 50, pos.x));
          pos.y = Math.max(50, Math.min(height - 50, pos.y));
        });

        return next;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [positions.size, dimensions, graphData, isDragging, draggedNode]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = "#fafaf9";
    ctx.fillRect(0, 0, width, height);

    // Draw edges
    ctx.strokeStyle = "#d4d4d4";
    ctx.lineWidth = 1;
    graphData.edges.forEach((edge) => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    });

    // Draw nodes
    graphData.nodes.forEach((node) => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const isHovered = hoveredNode?.id === node.id;
      const radius = node.type === "entity" ? 6 : 10;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + (isHovered ? 3 : 0), 0, 2 * Math.PI);
      ctx.fillStyle = NODE_COLORS[node.type];
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = "#1f2937";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw labels for content nodes
    ctx.font = "12px ui-serif, Georgia, serif";
    ctx.fillStyle = "#374151";
    graphData.nodes.forEach((node) => {
      if (node.type === "entity" && hoveredNode?.id !== node.id) return;

      const pos = positions.get(node.id);
      if (!pos) return;

      const label = node.label.length > 20 ? node.label.slice(0, 18) + "…" : node.label;
      ctx.fillText(label, pos.x + 15, pos.y + 4);
    });
  }, [positions, dimensions, graphData, hoveredNode]);

  // Mouse handlers
  const getNodeAtPosition = useCallback(
    (x: number, y: number): GraphNode | null => {
      for (const node of graphData.nodes) {
        const pos = positions.get(node.id);
        if (!pos) continue;

        const dx = x - pos.x;
        const dy = y - pos.y;
        const radius = node.type === "entity" ? 6 : 10;
        if (dx * dx + dy * dy <= (radius + 5) * (radius + 5)) {
          return node;
        }
      }
      return null;
    },
    [graphData.nodes, positions],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDragging && draggedNode) {
        setPositions((prev) => {
          const next = new Map(prev);
          const pos = next.get(draggedNode);
          if (pos) {
            pos.x = x;
            pos.y = y;
            pos.vx = 0;
            pos.vy = 0;
          }
          return next;
        });
      } else {
        const node = getNodeAtPosition(x, y);
        setHoveredNode(node);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = node ? "pointer" : "default";
        }
      }
    },
    [isDragging, draggedNode, getNodeAtPosition],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = getNodeAtPosition(x, y);

      if (node) {
        setIsDragging(true);
        setDraggedNode(node.id);
      }
    },
    [getNodeAtPosition],
  );

  const handleMouseUp = useCallback(() => {
    // Click on node - navigate if dragged node has a URL
    if (isDragging && draggedNode && hoveredNode?.id === draggedNode && hoveredNode.url) {
      void navigate({ to: hoveredNode.url });
    }
    setIsDragging(false);
    setDraggedNode(null);
  }, [isDragging, draggedNode, hoveredNode, navigate]);

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-border bg-white/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-screen-lg items-center justify-between">
          <div>
            <h1 className="font-serif text-xl text-foreground italic">Knowledge Graph</h1>
            <p className="text-sm text-muted">
              {graphData.nodes.length} nodes · {graphData.edges.length} connections
            </p>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link
              to="/blog"
              search={{ filter: undefined }}
              className="text-muted hover:text-foreground"
            >
              Blog
            </Link>
            <Link to="/wiki" className="text-muted hover:text-foreground">
              Wiki
            </Link>
          </nav>
        </div>
      </header>

      <div ref={containerRef} className="relative flex-1">
        <canvas
          ref={canvasRef}
          style={{ width: dimensions.width, height: dimensions.height }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 p-3 shadow-sm backdrop-blur">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS.blog }}
              />
              <span className="text-muted">Blog</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS.wiki }}
              />
              <span className="text-muted">Wiki</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: NODE_COLORS.entity }}
              />
              <span className="text-muted">Entity (no page)</span>
            </div>
          </div>
        </div>

        {/* Hovered node info */}
        {hoveredNode && (
          <div className="absolute top-4 right-4 max-w-xs rounded-lg bg-white/90 p-3 shadow-sm backdrop-blur">
            <h3 className="font-serif text-sm font-medium text-foreground">{hoveredNode.label}</h3>
            <p className="mt-1 text-xs text-muted capitalize">{hoveredNode.type}</p>
            {hoveredNode.tags && (
              <div className="mt-2 flex flex-wrap gap-1">
                {hoveredNode.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-border/50 px-1.5 py-0.5 text-xs text-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {hoveredNode.url && <p className="mt-2 text-xs text-subtle">Click to open</p>}
          </div>
        )}
      </div>
    </main>
  );
}
