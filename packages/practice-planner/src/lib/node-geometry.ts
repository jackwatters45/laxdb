import type { PracticeNode } from "@/data/types";

/** Returns the visual width, height, and rendered left/top for a node */
export function getNodeGeometry(node: PracticeNode) {
  const isStart = node.variant === "start";
  const isSplit = node.variant === "split";

  let width: number;
  let height: number;
  let left: number;
  let top: number;

  if (isStart) {
    width = 100;
    height = 100;
    left = node.position.x + 80;
    top = node.position.y;
  } else if (isSplit) {
    width = 180;
    height = 56;
    left = node.position.x + 40;
    top = node.position.y;
  } else if (node.type === "water-break") {
    width = 260;
    height = 36;
    left = node.position.x;
    top = node.position.y;
  } else {
    width = 260;
    height = 82;
    left = node.position.x;
    top = node.position.y;
  }

  return { width, height, left, top };
}

type Side = "top" | "bottom" | "left" | "right";

interface Anchor {
  x: number;
  y: number;
  side: Side;
}

function getCenter(g: { left: number; top: number; width: number; height: number }) {
  return { cx: g.left + g.width / 2, cy: g.top + g.height / 2 };
}

function getAnchorPoint(
  g: { left: number; top: number; width: number; height: number },
  side: Side,
): { x: number; y: number } {
  switch (side) {
    case "top":
      return { x: g.left + g.width / 2, y: g.top };
    case "bottom":
      return { x: g.left + g.width / 2, y: g.top + g.height };
    case "left":
      return { x: g.left, y: g.top + g.height / 2 };
    case "right":
      return { x: g.left + g.width, y: g.top + g.height / 2 };
  }
}

/**
 * Returns edge anchors that pick the best sides to connect.
 * Prefers vertical (bottom→top) for the natural top-down flow,
 * but switches to horizontal or inverted connections when nodes
 * are side-by-side or the target is above the source.
 */
export function getEdgeAnchors(
  source: PracticeNode,
  target: PracticeNode,
): { sx: number; sy: number; tx: number; ty: number; sourceSide: Side; targetSide: Side } {
  const sg = getNodeGeometry(source);
  const tg = getNodeGeometry(target);

  const sc = getCenter(sg);
  const tc = getCenter(tg);

  const dx = tc.cx - sc.cx;
  const dy = tc.cy - sc.cy;

  let sourceSide: Side;
  let targetSide: Side;

  // Vertical gap between source bottom and target top
  const vertGap = tg.top - (sg.top + sg.height);

  if (vertGap > -20) {
    // Target is below (or roughly level) — normal top-down flow
    sourceSide = "bottom";
    targetSide = "top";
  } else if (dy < -20) {
    // Target is above source — inverted flow
    sourceSide = "top";
    targetSide = "bottom";
  } else if (dx > 0) {
    // Target is to the right
    sourceSide = "right";
    targetSide = "left";
  } else {
    // Target is to the left
    sourceSide = "left";
    targetSide = "right";
  }

  const sp = getAnchorPoint(sg, sourceSide);
  const tp = getAnchorPoint(tg, targetSide);

  return { sx: sp.x, sy: sp.y, tx: tp.x, ty: tp.y, sourceSide, targetSide };
}
