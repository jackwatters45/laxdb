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
    // Centered: canvas shifts start by -50 + 130 = +80
    left = node.position.x + 80;
    top = node.position.y;
  } else if (isSplit) {
    width = 180;
    height = 56;
    // Centered: canvas shifts split by -90 + 130 = +40
    left = node.position.x + 40;
    top = node.position.y;
  } else {
    width = 260;
    height = 82;
    left = node.position.x;
    top = node.position.y;
  }

  return { width, height, left, top };
}

/** Returns the center-bottom of source and center-top of target in canvas coords */
export function getEdgeAnchors(source: PracticeNode, target: PracticeNode) {
  const sg = getNodeGeometry(source);
  const tg = getNodeGeometry(target);

  return {
    sx: sg.left + sg.width / 2,
    sy: sg.top + sg.height,
    tx: tg.left + tg.width / 2,
    ty: tg.top,
  };
}
