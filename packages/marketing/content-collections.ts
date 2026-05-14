import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypePrettyCode } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { z } from "zod";

import { toSlug } from "./src/lib/slug";

/**
 * Extract [[wiki-links]] from content
 */
function extractWikiLinks(content: string): string[] {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    if (match[1]) links.push(match[1]);
  }
  return [...new Set(links)];
}

/**
 * Transform [[wiki-links]] to public wiki links in content.
 */
function transformWikiLinks(content: string): string {
  return content.replaceAll(/\[\[([^\]]+)\]\]/gu, (_, label: string) => {
    return `[${label}](/wiki/${toSlug(label)})`;
  });
}

interface TableOfContentsItem {
  [key: string]: string | number;
  title: string;
  slug: string;
  depth: number;
}

function extractTableOfContents(content: string): TableOfContentsItem[] {
  const headings: TableOfContentsItem[] = [];
  const lines = content.replace(/^---[\s\S]*?---\s*/u, "").split("\n");
  let inCodeFence = false;

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) continue;

    const match = /^(#{2,3})\s+(.+)$/u.exec(line);
    if (!match) continue;

    const marker = match[1];
    const rawTitle = match[2];
    if (!marker || !rawTitle) continue;

    const title = rawTitle.replace(/\s+#$/u, "").trim();
    if (title.length === 0) continue;

    headings.push({
      title,
      slug: toSlug(title),
      depth: marker.length,
    });
  }

  return headings;
}

const posts = defineCollection({
  name: "posts",
  directory: "./src/content",
  include: "**/*.mdx",
  exclude: "changelog/**",
  schema: z.object({
    title: z.string(),
    published: z.iso.date(),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    authors: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    section: z.string().optional(),
    order: z.number().int().optional(),
    updated: z.iso.date().optional(),
    content: z.string(),
  }),
  transform: async (document, context) => {
    // Extract wiki links before transformation
    const wikiLinks = extractWikiLinks(document.content);

    // Transform wiki links in content before MDX compilation
    const transformedContent = transformWikiLinks(document.content);
    const transformedDocument = { ...document, content: transformedContent };

    const mdx = await compileMDX(context, transformedDocument, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
        [rehypePrettyCode, { theme: "github-dark" }],
      ],
    });

    const headerImageMatch = document.content.match(/!\[([^\]]*)\]\(([^)]+)\)/u);
    const headerImage = headerImageMatch ? headerImageMatch[2] : undefined;

    const excerpt =
      document.content
        .replace(/^---[\s\S]*?---\s*/u, "")
        .replace(/^!\[[^\]]*\]\([^)]+\)\s*/u, "")
        .split("\n\n")[0]
        ?.replaceAll(/\[\[([^\]]+)\]\]/gu, "$1")
        .trim() ?? undefined;

    return {
      ...document,
      slug: document._meta.path,
      excerpt,
      headerImage,
      tableOfContents: extractTableOfContents(document.content),
      wikiLinks, // Links for graph view
      mdx,
    };
  },
});

const changelog = defineCollection({
  name: "changelog",
  directory: "./src/content/changelog",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    published: z.iso.date(),
    draft: z.boolean().default(false),
    category: z.enum(["data", "feature", "improvement", "community"]),
    summary: z.string(),
    content: z.string(),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm],
    });
    return {
      ...document,
      slug: document._meta.path,
      mdx,
    };
  },
});

export default defineConfig({
  collections: [posts, changelog],
});
