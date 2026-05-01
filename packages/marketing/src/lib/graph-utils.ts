import type { Post } from "content-collections";

import { toSlug } from "./slug";

export type NodeType = "blog" | "wiki" | "entity" | "tag";
export type GraphEdgeKind = "wiki" | "tag";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  url?: string;
  tags?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: GraphEdgeKind;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const NODE_COLORS: Record<NodeType, string> = {
  blog: "#7aa2f7",
  wiki: "#9ece6a",
  entity: "#a9b1d6",
  tag: "#e0af68",
};

function getNodeType(post: Post): NodeType {
  if (post.tags?.includes("blog")) return "blog";
  if (post.tags?.includes("wiki")) return "wiki";
  return "wiki";
}

export function buildGraphData(posts: Post[]): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));

  const addNode = (node: GraphNode) => {
    if (nodeIds.has(node.id)) return;
    nodes.push(node);
    nodeIds.add(node.id);
  };

  const addEdge = (edge: GraphEdge) => {
    const edgeId = `${edge.kind}:${edge.source}->${edge.target}`;
    if (edgeIds.has(edgeId)) return;
    edges.push(edge);
    edgeIds.add(edgeId);
  };

  for (const post of posts) {
    const sourceId = `content:${post.slug}`;
    addNode({
      id: sourceId,
      label: post.title,
      type: getNodeType(post),
      url: `/content/${post.slug}`,
      tags: post.tags,
    });

    for (const tag of post.tags ?? []) {
      const normalizedTag = tag.toLowerCase();
      const tagId = `tag:${normalizedTag}`;
      addNode({
        id: tagId,
        label: `#${tag}`,
        type: "tag",
        url: `/tag/${normalizedTag}`,
      });
      addEdge({
        source: sourceId,
        target: tagId,
        kind: "tag",
        label: "tagged",
      });
    }
  }

  for (const post of posts) {
    const sourceId = `content:${post.slug}`;

    for (const link of post.wikiLinks ?? []) {
      const targetSlug = toSlug(link);
      const targetPost = postsBySlug.get(targetSlug);

      if (targetPost) {
        addEdge({
          source: sourceId,
          target: `content:${targetPost.slug}`,
          kind: "wiki",
          label: "mentions",
        });
        continue;
      }

      const entityId = `entity:${targetSlug}`;
      addNode({
        id: entityId,
        label: link,
        type: "entity",
      });
      addEdge({
        source: sourceId,
        target: entityId,
        kind: "wiki",
        label: "mentions",
      });
    }
  }

  return { nodes, edges };
}

export function getContentByTag(posts: Post[], tag: string): Post[] {
  const normalizedTag = tag.toLowerCase();
  return posts.filter((p) => p.tags?.some((t) => t.toLowerCase() === normalizedTag));
}

export function getContentByTags(
  posts: Post[],
  includeTags: string[],
  excludeTags: string[] = [],
): Post[] {
  return posts.filter((p) => {
    const hasAllIncluded = includeTags.every((tag) => p.tags?.includes(tag));
    const hasNoExcluded = excludeTags.every((tag) => !p.tags?.includes(tag));
    return hasAllIncluded && hasNoExcluded;
  });
}

export function groupBySubjectTag(posts: Post[]): Record<string, Post[]> {
  const subjectTags = new Set(["player", "team", "league", "skill", "media", "event"]);
  const grouped: Record<string, Post[]> = {};

  for (const post of posts) {
    const subjects = post.tags?.filter((t) => subjectTags.has(t)) ?? [];
    if (subjects.length === 0) {
      grouped["other"] ??= [];
      grouped["other"].push(post);
    } else {
      for (const subject of subjects) {
        grouped[subject] ??= [];
        grouped[subject].push(post);
      }
    }
  }

  return grouped;
}
