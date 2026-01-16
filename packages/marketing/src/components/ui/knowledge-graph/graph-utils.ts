import type { Post } from "content-collections";
import type { GraphData, GraphLink, GraphNode } from "./graph-types";

/**
 * Extracts all unique tags from a collection of posts
 */
export function extractTags(posts: readonly Post[]): readonly string[] {
  const tagSet = new Set<string>();
  for (const post of posts) {
    if (post.tags) {
      for (const tag of post.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).toSorted();
}

/**
 * Parses internal links from MDX content
 * Looks for markdown links in format [text](/blog/slug) or [text](/slug)
 */
export function parseInternalLinks(content: string): readonly string[] {
  const linkRegex = /\[([^\]]+)\]\(\/(?:blog\/)?([^)]+)\)/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    const slug = match[2];
    // Filter out external links and anchors
    if (slug && !slug.startsWith("http") && !slug.startsWith("#")) {
      links.push(slug);
    }
  }

  return [...new Set(links)];
}

/**
 * Builds graph data from posts for visualization
 */
export function buildGraphData(posts: readonly Post[]): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const tagConnectionCounts = new Map<string, number>();
  const postSlugs = new Set(posts.map((p) => p.slug));

  // Count tag connections for sizing
  for (const post of posts) {
    if (post.tags) {
      for (const tag of post.tags) {
        tagConnectionCounts.set(tag, (tagConnectionCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  // Create post nodes
  for (const post of posts) {
    nodes.push({
      id: `post:${post.slug}`,
      label: post.title,
      type: "post",
      slug: post.slug,
      size: 1 + (post.tags?.length ?? 0) * 0.2,
    });
  }

  // Create tag nodes
  const allTags = extractTags(posts);
  for (const tag of allTags) {
    const connectionCount = tagConnectionCounts.get(tag) ?? 1;
    nodes.push({
      id: `tag:${tag}`,
      label: tag,
      type: "tag",
      size: 0.5 + connectionCount * 0.3,
    });
  }

  // Create post-tag links
  for (const post of posts) {
    if (post.tags) {
      for (const tag of post.tags) {
        links.push({
          source: `post:${post.slug}`,
          target: `tag:${tag}`,
          type: "tag",
        });
      }
    }
  }

  // Create post-post links from internal references
  for (const post of posts) {
    const internalLinks = parseInternalLinks(post.content);
    for (const linkedSlug of internalLinks) {
      // Only create link if target post exists
      if (postSlugs.has(linkedSlug)) {
        links.push({
          source: `post:${post.slug}`,
          target: `post:${linkedSlug}`,
          type: "internal",
        });
      }
    }
  }

  return { nodes, links };
}
