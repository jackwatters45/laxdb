import type { Post } from "content-collections";

import { toSlug } from "./slug";

export type NodeType = "blog" | "wiki" | "entity" | "tag";

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
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const NODE_COLORS: Record<NodeType, string> = {
  blog: "#60a5fa", // blue - has blog tag
  wiki: "#34d399", // green - has wiki tag (no blog)
  entity: "#6b7280", // gray - referenced but no page
  tag: "#f472b6", // pink - tag nodes
};

function getNodeType(post: Post): NodeType {
  if (post.tags?.includes("blog")) return "blog";
  if (post.tags?.includes("wiki")) return "wiki";
  return "wiki"; // default for content without specific tags
}

export function buildGraphData(posts: Post[]): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();
  const entityNodes = new Map<string, string>(); // slug -> label

  // Add content nodes
  for (const post of posts) {
    const nodeId = `content:${post.slug}`;
    nodes.push({
      id: nodeId,
      label: post.title,
      type: getNodeType(post),
      url: `/content/${post.slug}`,
      tags: post.tags,
    });
    nodeIds.add(nodeId);

    // Track wiki links for entity nodes
    if (post.wikiLinks) {
      for (const link of post.wikiLinks) {
        entityNodes.set(toSlug(link), link);
      }
    }
  }

  // Create edges from wiki links
  for (const post of posts) {
    if (!post.wikiLinks) continue;

    const sourceId = `content:${post.slug}`;

    for (const link of post.wikiLinks) {
      const targetSlug = toSlug(link);
      const targetPost = posts.find((p) => p.slug === targetSlug);

      if (targetPost) {
        // Link to existing content
        edges.push({
          source: sourceId,
          target: `content:${targetSlug}`,
        });
      } else {
        // Create entity node if doesn't exist
        const entityId = `entity:${targetSlug}`;
        if (!nodeIds.has(entityId)) {
          nodes.push({
            id: entityId,
            label: link,
            type: "entity",
          });
          nodeIds.add(entityId);
        }
        edges.push({
          source: sourceId,
          target: entityId,
        });
      }
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
      // Put in "other" category
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
