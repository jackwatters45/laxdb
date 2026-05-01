import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent, WheelEvent } from "react";

import {
  buildGraphData,
  NODE_COLORS,
  type GraphData,
  type GraphEdge,
  type GraphNode,
  type NodeType,
} from "@/lib/graph-utils";
import { publishedPosts } from "@/lib/posts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/graph/")({
  validateSearch: (search: Record<string, unknown>): GraphSearch => ({
    q: readSearchString(search.q),
    focus: readSearchString(search.focus),
    tags: readSearchBoolean(search.tags),
    depth: readGraphDepth(search.depth),
  }),
  component: GraphPage,
});

type GraphDepth = "1" | "2" | "all";

type GraphSearch = {
  q?: string;
  focus?: string;
  tags?: boolean;
  depth?: GraphDepth;
};

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

interface Camera {
  x: number;
  y: number;
  scale: number;
}

interface VisibleGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

type PointerMode =
  | {
      kind: "node";
      nodeId: string;
      pointerId: number;
      startX: number;
      startY: number;
      moved: boolean;
    }
  | {
      kind: "pan";
      pointerId: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    };

const GRAPH_DEPTHS: readonly GraphDepth[] = ["1", "2", "all"];

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.4;

function readSearchString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readSearchBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function isGraphDepth(value: string): value is GraphDepth {
  return value === "1" || value === "2" || value === "all";
}

function readGraphDepth(value: unknown): GraphDepth | undefined {
  if (typeof value === "string" && isGraphDepth(value)) return value;
  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashUnit(value: string, salt: number): number {
  let hash = 2166136261 + salt;
  for (const character of value) {
    const point = character.codePointAt(0);
    if (point !== undefined) hash ^= point;
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash) % 4294967295) / 4294967295;
}

function getTypeWeight(type: NodeType): number {
  switch (type) {
    case "blog":
      return 1.25;
    case "wiki":
      return 1.15;
    case "tag":
      return 1;
    case "entity":
      return 0.8;
  }
}

function getNodeRadius(node: GraphNode, degree: number): number {
  const base = node.type === "entity" ? 4.5 : node.type === "tag" ? 6.5 : 7.5;
  return base + Math.min(8, Math.sqrt(Math.max(1, degree)) * getTypeWeight(node.type));
}

function buildAdjacency(edges: readonly GraphEdge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    const sourceSet = adjacency.get(edge.source) ?? new Set<string>();
    sourceSet.add(edge.target);
    adjacency.set(edge.source, sourceSet);

    const targetSet = adjacency.get(edge.target) ?? new Set<string>();
    targetSet.add(edge.source);
    adjacency.set(edge.target, targetSet);
  }
  return adjacency;
}

function buildDegrees(edges: readonly GraphEdge[]): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }
  return degrees;
}

function buildVisibleGraph(
  graphData: GraphData,
  includeTags: boolean,
  focusId: string | undefined,
  depth: GraphDepth,
): VisibleGraph {
  const candidateNodes = includeTags
    ? graphData.nodes
    : graphData.nodes.filter((node) => node.type !== "tag");
  const candidateIds = new Set(candidateNodes.map((node) => node.id));
  const candidateEdges = graphData.edges.filter(
    (edge) =>
      candidateIds.has(edge.source) &&
      candidateIds.has(edge.target) &&
      (includeTags || edge.kind !== "tag"),
  );

  if (!focusId || depth === "all" || !candidateIds.has(focusId)) {
    return { nodes: candidateNodes, edges: candidateEdges };
  }

  const maxDepth = depth === "1" ? 1 : 2;
  const adjacency = buildAdjacency(candidateEdges);
  const keptIds = new Set<string>([focusId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: focusId, depth: 0 }];

  for (const item of queue) {
    if (item.depth >= maxDepth) continue;
    for (const neighbor of adjacency.get(item.id) ?? []) {
      if (keptIds.has(neighbor)) continue;
      keptIds.add(neighbor);
      queue.push({ id: neighbor, depth: item.depth + 1 });
    }
  }

  return {
    nodes: candidateNodes.filter((node) => keptIds.has(node.id)),
    edges: candidateEdges.filter((edge) => keptIds.has(edge.source) && keptIds.has(edge.target)),
  };
}

function screenToWorld(x: number, y: number, camera: Camera): { x: number; y: number } {
  return {
    x: (x - camera.x) / camera.scale,
    y: (y - camera.y) / camera.scale,
  };
}

function worldToScreen(x: number, y: number, camera: Camera): { x: number; y: number } {
  return {
    x: x * camera.scale + camera.x,
    y: y * camera.scale + camera.y,
  };
}

function GraphPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const graphData = useMemo(() => buildGraphData(publishedPosts), []);
  const focusNode = graphData.nodes.find((node) => node.id === search.focus) ?? null;
  const focusId = focusNode?.id;
  const includeTags = search.tags ?? true;
  const depth = search.depth ?? "all";
  const query = search.q ?? "";

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const pointerModeRef = useRef<PointerMode | null>(null);
  const suppressOpenUntilRef = useRef(0);

  const [dimensions, setDimensions] = useState({ width: 960, height: 640 });
  const [positions, setPositions] = useState(new Map<string, NodePosition>());
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const [reducedMotion, setReducedMotion] = useState(false);

  const visibleGraph = useMemo(
    () => buildVisibleGraph(graphData, includeTags, focusId, depth),
    [depth, focusId, graphData, includeTags],
  );
  const degrees = useMemo(() => buildDegrees(visibleGraph.edges), [visibleGraph.edges]);
  const adjacency = useMemo(() => buildAdjacency(visibleGraph.edges), [visibleGraph.edges]);
  const activeNode = hoveredNode ?? focusNode;
  const activeNodeId = activeNode?.id;
  const connectedIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    return new Set<string>([activeNodeId, ...(adjacency.get(activeNodeId) ?? [])]);
  }, [activeNodeId, adjacency]);
  const visibleSignature = useMemo(
    () => visibleGraph.nodes.map((node) => node.id).join("|"),
    [visibleGraph.nodes],
  );
  const normalizedQuery = query.toLowerCase();
  const matchingNodeIds = useMemo(() => {
    if (normalizedQuery.length === 0) return new Set<string>();
    return new Set(
      graphData.nodes
        .filter(
          (node) =>
            node.label.toLowerCase().includes(normalizedQuery) ||
            (node.tags ?? []).some((tag) => tag.toLowerCase().includes(normalizedQuery)),
        )
        .map((node) => node.id),
    );
  }, [graphData.nodes, normalizedQuery]);
  const searchResults = useMemo(() => {
    if (normalizedQuery.length === 0) return [];
    return graphData.nodes
      .filter((node) => matchingNodeIds.has(node.id))
      .toSorted((a, b) => (degrees.get(b.id) ?? 0) - (degrees.get(a.id) ?? 0))
      .slice(0, 8);
  }, [degrees, graphData.nodes, matchingNodeIds, normalizedQuery.length]);
  const focusConnections = useMemo(() => {
    if (!focusId) return [];
    const neighborIds = adjacency.get(focusId) ?? new Set<string>();
    return graphData.nodes
      .filter((node) => neighborIds.has(node.id))
      .toSorted((a, b) => (degrees.get(b.id) ?? 0) - (degrees.get(a.id) ?? 0))
      .slice(0, 8);
  }, [adjacency, degrees, focusId, graphData.nodes]);

  const writeSearch = useCallback(
    (next: GraphSearch) => {
      void navigate({ to: "/graph", search: next });
    },
    [navigate],
  );

  const selectNode = useCallback(
    (node: GraphNode | null) => {
      writeSearch({
        q: search.q,
        focus: node?.id,
        tags: includeTags,
        depth,
      });
    },
    [depth, includeTags, search.q, writeSearch],
  );

  const getNodeAtScreenPosition = useCallback(
    (screenX: number, screenY: number): GraphNode | null => {
      const point = screenToWorld(screenX, screenY, camera);
      for (let i = visibleGraph.nodes.length - 1; i >= 0; i--) {
        const node = visibleGraph.nodes[i];
        if (!node) continue;
        const pos = positions.get(node.id);
        if (!pos) continue;
        const dx = point.x - pos.x;
        const dy = point.y - pos.y;
        const radius = getNodeRadius(node, degrees.get(node.id) ?? 0) + 5 / camera.scale;
        if (dx * dx + dy * dy <= radius * radius) return node;
      }
      return null;
    },
    [camera, degrees, positions, visibleGraph.nodes],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      setReducedMotion(media.matches);
    };
    updateReducedMotion();
    media.addEventListener("change", updateReducedMotion);
    return () => {
      media.removeEventListener("change", updateReducedMotion);
    };
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      const container = containerRef.current;
      if (!container) return;
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    const container = containerRef.current;
    if (container) observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setPositions((previous) => {
      const next = new Map<string, NodePosition>();
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const radius = Math.max(150, Math.min(dimensions.width, dimensions.height) * 0.38);

      visibleGraph.nodes.forEach((node, index) => {
        const existing = previous.get(node.id);
        if (existing) {
          next.set(node.id, existing);
          return;
        }

        const ring = node.type === "tag" ? 0.78 : node.type === "entity" ? 1.06 : 0.54;
        const angle = Math.PI * 2 * hashUnit(node.id, index + 17);
        const wobble = 0.74 + hashUnit(node.id, 91) * 0.34;
        next.set(node.id, {
          x: centerX + Math.cos(angle) * radius * ring * wobble,
          y: centerY + Math.sin(angle) * radius * ring * wobble,
          vx: 0,
          vy: 0,
          pinned: false,
        });
      });

      return next;
    });
  }, [dimensions.height, dimensions.width, visibleGraph.nodes, visibleSignature]);

  useEffect(() => {
    if (positions.size === 0) return;

    const simulate = () => {
      if (!reducedMotion) {
        setPositions((previous) => {
          const next = new Map<string, NodePosition>(previous);
          const centerX = dimensions.width / 2;
          const centerY = dimensions.height / 2;
          const edgeLookup = visibleGraph.edges;
          const nodes = visibleGraph.nodes;

          for (const node of nodes) {
            const pos = next.get(node.id);
            if (!pos || pos.pinned) continue;

            let fx = (centerX - pos.x) * 0.0025;
            let fy = (centerY - pos.y) * 0.0025;

            for (const other of nodes) {
              if (other.id === node.id) continue;
              const otherPos = next.get(other.id);
              if (!otherPos) continue;

              const dx = pos.x - otherPos.x;
              const dy = pos.y - otherPos.y;
              const distance = Math.max(18, Math.sqrt(dx * dx + dy * dy));
              const repulsion = node.type === "tag" || other.type === "tag" ? 2800 : 3600;
              const force = repulsion / (distance * distance);
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }

            for (const edge of edgeLookup) {
              let otherId: string | undefined;
              if (edge.source === node.id) otherId = edge.target;
              if (edge.target === node.id) otherId = edge.source;
              if (!otherId) continue;

              const otherPos = next.get(otherId);
              if (!otherPos) continue;
              const dx = otherPos.x - pos.x;
              const dy = otherPos.y - pos.y;
              const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
              const targetDistance = edge.kind === "tag" ? 118 : 154;
              const force = (distance - targetDistance) * (edge.kind === "tag" ? 0.006 : 0.009);
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }

            pos.vx = (pos.vx + fx) * 0.82;
            pos.vy = (pos.vy + fy) * 0.82;
            pos.x += pos.vx;
            pos.y += pos.vy;
          }

          return next;
        });
      }

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    dimensions.height,
    dimensions.width,
    positions.size,
    reducedMotion,
    visibleGraph.edges,
    visibleGraph.nodes,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#070a12");
    background.addColorStop(0.5, "#0d1222");
    background.addColorStop(1, "#11131d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#242b3f";
    for (let x = ((camera.x % 34) + 34) % 34; x < width; x += 34) {
      for (let y = ((camera.y % 34) + 34) % 34; y < height; y += 34) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.scale, camera.scale);

    for (const edge of visibleGraph.edges) {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) continue;

      const highlighted =
        connectedIds.size === 0 || (connectedIds.has(edge.source) && connectedIds.has(edge.target));
      ctx.globalAlpha = highlighted ? 0.42 : 0.08;
      ctx.strokeStyle = edge.kind === "tag" ? "#e0af68" : "#6b728f";
      ctx.lineWidth = (highlighted ? 1.2 : 0.8) / camera.scale;
      ctx.setLineDash(edge.kind === "tag" ? [4 / camera.scale, 7 / camera.scale] : []);
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    for (const node of visibleGraph.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const degree = degrees.get(node.id) ?? 0;
      const isSelected = focusNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isMatched = matchingNodeIds.has(node.id);
      const highlighted = connectedIds.size === 0 || connectedIds.has(node.id) || isMatched;
      const radius = getNodeRadius(node, degree);

      if (isSelected || isHovered || isMatched) {
        ctx.globalAlpha = isSelected ? 0.26 : 0.18;
        ctx.fillStyle = NODE_COLORS[node.type];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + (isSelected ? 14 : 10), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = highlighted ? 1 : 0.22;
      ctx.fillStyle = NODE_COLORS[node.type];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#f8fafc" : "rgba(248,250,252,0.68)";
      ctx.lineWidth = (isSelected ? 1.6 : 0.7) / camera.scale;
      ctx.stroke();

      if (pos.pinned) {
        ctx.fillStyle = "#f8fafc";
        ctx.globalAlpha = 0.82;
        ctx.beginPath();
        ctx.arc(pos.x + radius * 0.62, pos.y - radius * 0.62, 2.5 / camera.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    ctx.font = `${12 / camera.scale}px ui-serif, Georgia, serif`;
    ctx.textBaseline = "middle";
    for (const node of visibleGraph.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const degree = degrees.get(node.id) ?? 0;
      const important =
        node.id === focusNode?.id ||
        node.id === hoveredNode?.id ||
        matchingNodeIds.has(node.id) ||
        (camera.scale > 0.82 && degree >= 3 && node.type !== "entity");
      if (!important) continue;

      const radius = getNodeRadius(node, degree);
      const label = node.label.length > 34 ? `${node.label.slice(0, 32)}…` : node.label;
      ctx.globalAlpha =
        connectedIds.size === 0 || connectedIds.has(node.id) || matchingNodeIds.has(node.id)
          ? 0.94
          : 0.34;
      ctx.fillStyle = "#d8deff";
      ctx.fillText(label, pos.x + radius + 7 / camera.scale, pos.y + 1 / camera.scale);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }, [
    camera,
    connectedIds,
    degrees,
    dimensions,
    focusNode,
    hoveredNode,
    matchingNodeIds,
    positions,
    visibleGraph.edges,
    visibleGraph.nodes,
  ]);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      const mode = pointerModeRef.current;

      if (mode?.kind === "node" && mode.pointerId === event.pointerId) {
        const moved = mode.moved || Math.hypot(screenX - mode.startX, screenY - mode.startY) > 3;
        pointerModeRef.current = { ...mode, moved };
        const point = screenToWorld(screenX, screenY, camera);
        setPositions((previous) => {
          const next = new Map<string, NodePosition>(previous);
          const pos = next.get(mode.nodeId);
          if (pos) {
            pos.x = point.x;
            pos.y = point.y;
            pos.vx = 0;
            pos.vy = 0;
            pos.pinned = true;
          }
          return next;
        });
        return;
      }

      if (mode?.kind === "pan" && mode.pointerId === event.pointerId) {
        setCamera((previous) => ({
          ...previous,
          x: mode.originX + screenX - mode.startX,
          y: mode.originY + screenY - mode.startY,
        }));
        return;
      }

      const node = getNodeAtScreenPosition(screenX, screenY);
      setHoveredNode(node);
      if (canvasRef.current) canvasRef.current.style.cursor = node ? "grab" : "move";
    },
    [camera, getNodeAtScreenPosition],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      const node = getNodeAtScreenPosition(screenX, screenY);
      event.currentTarget.setPointerCapture(event.pointerId);

      if (node) {
        pointerModeRef.current = {
          kind: "node",
          nodeId: node.id,
          pointerId: event.pointerId,
          startX: screenX,
          startY: screenY,
          moved: false,
        };
        setHoveredNode(node);
        event.currentTarget.style.cursor = "grabbing";
        return;
      }

      pointerModeRef.current = {
        kind: "pan",
        pointerId: event.pointerId,
        startX: screenX,
        startY: screenY,
        originX: camera.x,
        originY: camera.y,
      };
      event.currentTarget.style.cursor = "grabbing";
    },
    [camera.x, camera.y, getNodeAtScreenPosition],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const mode = pointerModeRef.current;
      if (mode?.kind === "node" && mode.pointerId === event.pointerId) {
        if (mode.moved) {
          suppressOpenUntilRef.current = Date.now() + 500;
        } else {
          const node = graphData.nodes.find((item) => item.id === mode.nodeId) ?? null;
          selectNode(node);
        }
      }
      pointerModeRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      event.currentTarget.style.cursor = hoveredNode ? "grab" : "move";
    },
    [graphData.nodes, hoveredNode, selectNode],
  );

  const handleDoubleClick = useCallback(() => {
    if (Date.now() < suppressOpenUntilRef.current) return;
    if (hoveredNode?.url) {
      void navigate({ to: hoveredNode.url });
    }
  }, [hoveredNode, navigate]);

  const handleWheel = useCallback((event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    setCamera((previous) => {
      const world = screenToWorld(screenX, screenY, previous);
      const nextScale = clamp(previous.scale * (event.deltaY > 0 ? 0.9 : 1.1), MIN_ZOOM, MAX_ZOOM);
      return {
        scale: nextScale,
        x: screenX - world.x * nextScale,
        y: screenY - world.y * nextScale,
      };
    });
  }, []);

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextQuery = event.currentTarget.value;
      writeSearch({
        q: nextQuery.trim().length > 0 ? nextQuery : undefined,
        focus: focusId,
        tags: includeTags,
        depth,
      });
    },
    [depth, focusId, includeTags, writeSearch],
  );

  const hoveredScreen = hoveredNode ? positions.get(hoveredNode.id) : undefined;
  const tooltipPosition = hoveredScreen
    ? worldToScreen(hoveredScreen.x, hoveredScreen.y, camera)
    : undefined;

  return (
    <main className="relative flex h-dvh overflow-hidden bg-[#070a12] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_20%_10%,rgba(122,162,247,0.14),transparent_28rem),radial-gradient(circle_at_82%_72%,rgba(224,175,104,0.12),transparent_24rem)] opacity-40"
      />

      <div ref={containerRef} className="absolute inset-0">
        <canvas
          ref={canvasRef}
          aria-label="Interactive knowledge graph. Drag nodes to pin them, drag the background to pan, and use the mouse wheel to zoom."
          className="block size-full touch-none"
          role="img"
          style={{ width: dimensions.width, height: dimensions.height }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 md:p-6">
        <section className="pointer-events-auto max-w-md rounded-2xl border border-white/10 bg-slate-950/78 p-4 shadow-xl shadow-black/30 backdrop-blur-md">
          <Link to="/" className="text-xs text-slate-400 transition-colors hover:text-slate-100">
            LaxDB
          </Link>
          <h1 className="mt-1 font-serif text-2xl text-balance text-slate-50 italic md:text-3xl">
            Knowledge graph
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-pretty text-slate-400">
            An Obsidian-style map of lacrosse writing, wiki links, and topic clusters.
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-xs tabular-nums">
            <div className="rounded-lg bg-white/[0.06] p-2">
              <dt className="text-slate-500">visible</dt>
              <dd className="mt-0.5 text-slate-100">{visibleGraph.nodes.length}</dd>
            </div>
            <div className="rounded-lg bg-white/[0.06] p-2">
              <dt className="text-slate-500">links</dt>
              <dd className="mt-0.5 text-slate-100">{visibleGraph.edges.length}</dd>
            </div>
            <div className="rounded-lg bg-white/[0.06] p-2">
              <dt className="text-slate-500">zoom</dt>
              <dd className="mt-0.5 text-slate-100">{Math.round(camera.scale * 100)}%</dd>
            </div>
          </dl>
        </section>

        <nav className="pointer-events-auto hidden gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm shadow-xl shadow-black/20 backdrop-blur-md md:flex">
          <Link
            to="/blog"
            search={{ filter: undefined }}
            className="text-slate-400 hover:text-slate-100"
          >
            Blog
          </Link>
          <Link to="/wiki" className="text-slate-400 hover:text-slate-100">
            Wiki
          </Link>
        </nav>
      </header>

      <aside className="absolute bottom-4 left-4 z-10 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-slate-950/82 p-4 shadow-xl shadow-black/30 backdrop-blur-md md:bottom-6 md:left-6">
        <label className="text-sm font-medium text-slate-200" htmlFor="graph-search">
          Find a node
        </label>
        <input
          id="graph-search"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search players, leagues, ideas…"
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 transition-colors outline-none placeholder:text-slate-600 focus:border-slate-400"
        />

        {searchResults.length > 0 && (
          <div className="mt-3 max-h-44 space-y-1 overflow-auto pr-1">
            {searchResults.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  selectNode(node);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-white/[0.08]",
                  focusId === node.id ? "bg-white/[0.1] text-slate-50" : "text-slate-300",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[node.type] }}
                />
                <span className="truncate">{node.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              writeSearch({
                q: search.q,
                focus: focusId,
                tags: !includeTags,
                depth,
              });
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors active:scale-[0.98]",
              includeTags
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border-white/10 text-slate-400 hover:text-slate-100",
            )}
          >
            tag nodes {includeTags ? "on" : "off"}
          </button>

          {GRAPH_DEPTHS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                writeSearch({
                  q: search.q,
                  focus: focusId,
                  tags: includeTags,
                  depth: item,
                });
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors active:scale-[0.98]",
                depth === item
                  ? "border-slate-200/40 bg-slate-100/10 text-slate-50"
                  : "border-white/10 text-slate-400 hover:text-slate-100",
              )}
            >
              {item === "all" ? "global" : `${item}-hop`}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => {
              setCamera({ x: 0, y: 0, scale: 1 });
            }}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-slate-50 active:scale-[0.98]"
          >
            reset view
          </button>
          <button
            type="button"
            onClick={() => {
              setPositions((previous) => {
                const next = new Map<string, NodePosition>();
                previous.forEach((position, id) => {
                  next.set(id, { ...position, pinned: false });
                });
                return next;
              });
            }}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-slate-50 active:scale-[0.98]"
          >
            unpin all
          </button>
          {focusNode && (
            <button
              type="button"
              onClick={() => {
                selectNode(null);
              }}
              className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-slate-50 active:scale-[0.98]"
            >
              clear focus
            </button>
          )}
        </div>
      </aside>

      {focusNode && (
        <aside className="absolute top-32 right-4 z-10 hidden w-80 rounded-2xl border border-white/10 bg-slate-950/82 p-4 shadow-xl shadow-black/30 backdrop-blur-md md:block">
          <div className="flex items-start gap-3">
            <span
              className="mt-1 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: NODE_COLORS[focusNode.type] }}
            />
            <div className="min-w-0">
              <h2 className="font-serif text-lg text-balance text-slate-50 italic">
                {focusNode.label}
              </h2>
              <p className="mt-1 text-xs text-slate-500 capitalize">
                {focusNode.type} · {degrees.get(focusNode.id) ?? 0} connections
              </p>
            </div>
          </div>

          {focusNode.tags && focusNode.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {focusNode.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-white/[0.07] px-2 py-1 text-xs text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {focusConnections.length > 0 && (
            <section className="mt-5">
              <h3 className="text-xs font-medium text-slate-400">Nearest links</h3>
              <div className="mt-2 space-y-1">
                {focusConnections.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      selectNode(node);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-50"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: NODE_COLORS[node.type] }}
                    />
                    <span className="truncate">{node.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {focusNode.url && (
            <a
              href={focusNode.url}
              className="mt-5 inline-flex rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950 transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              Open page
            </a>
          )}
        </aside>
      )}

      {hoveredNode && tooltipPosition && (
        <div
          className="pointer-events-none absolute z-20 max-w-64 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 shadow-xl shadow-black/30"
          style={{ left: tooltipPosition.x + 16, top: tooltipPosition.y + 16 }}
        >
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: NODE_COLORS[hoveredNode.type] }}
            />
            <span className="truncate font-medium">{hoveredNode.label}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Click to focus · drag to pin
            {hoveredNode.url ? " · double-click to open" : ""}
          </p>
        </div>
      )}

      <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/78 p-1 shadow-xl shadow-black/30 backdrop-blur-md md:right-6 md:bottom-6">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => {
            setCamera((previous) => ({
              ...previous,
              scale: clamp(previous.scale * 0.88, MIN_ZOOM, MAX_ZOOM),
            }));
          }}
          className="size-9 rounded-full text-lg text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-50 active:scale-[0.98]"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => {
            setCamera((previous) => ({
              ...previous,
              scale: clamp(previous.scale * 1.12, MIN_ZOOM, MAX_ZOOM),
            }));
          }}
          className="size-9 rounded-full text-lg text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-50 active:scale-[0.98]"
        >
          +
        </button>
      </div>
    </main>
  );
}
