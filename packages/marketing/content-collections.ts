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
 * Transform [[wiki-links]] to markdown links in content
 */
function transformWikiLinks(content: string): string {
  return content.replaceAll(/\[\[([^\]]+)\]\]/g, (_, label: string) => {
    return `[${label}](/content/${toSlug(label)})`;
  });
}

const pages = defineCollection({
  name: "pages",
  directory: "./src/pages",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    content: z.string(),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
        [rehypePrettyCode, { theme: "github-dark" }],
      ],
    });

    return {
      ...document,
      slug: document._meta.path,
      mdx,
    };
  },
});

const posts = defineCollection({
  name: "posts",
  directory: "./src/content",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    published: z.iso.date(),
    description: z.string().optional(),
    authors: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
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

    const headerImageMatch = document.content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    const headerImage = headerImageMatch ? headerImageMatch[2] : undefined;

    const excerpt =
      document.content
        .replace(/^---[\s\S]*?---\s*/, "")
        .replace(/^!\[[^\]]*]\([^)]+\)\s*/, "")
        .split("\n\n")[0]
        ?.trim() ?? undefined;

    return {
      ...document,
      slug: document._meta.path,
      excerpt,
      headerImage,
      wikiLinks, // Links for graph view
      mdx,
    };
  },
});

export default defineConfig({
  collections: [pages, posts],
});
