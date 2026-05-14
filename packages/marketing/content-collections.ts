import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX, type Options } from "@content-collections/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypePrettyCode } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { z } from "zod";

import { toSlug } from "./src/lib/slug";

const imageExtensions = new Set(["avif", "gif", "jpeg", "jpg", "png", "svg", "webp"]);

function parseObsidianTarget(value: string): { target: string; heading?: string; label?: string } {
  const [targetWithHeading = value, label] = value.split("|");
  const [target = value, heading] = targetWithHeading.split("#");

  return {
    target: target.trim(),
    heading: heading?.trim(),
    label: label?.trim(),
  };
}

function encodeAssetPath(path: string): string {
  return path
    .trim()
    .replace(/^\/+/, "")
    .split("/")
    .filter((segment) => segment.length > 0)
    .map(encodeURIComponent)
    .join("/");
}

function basename(path: string): string {
  const lastSegment =
    path
      .split("/")
      .filter((segment) => segment.length > 0)
      .at(-1) ?? path;
  return lastSegment.replace(/\.[^.]+$/u, "");
}

function isImagePath(path: string): boolean {
  const extension = path.split(".").at(-1)?.toLowerCase();
  return extension !== undefined && imageExtensions.has(extension);
}

function toWikiHref(target: string, heading?: string): string {
  const headingHash = heading ? `#${toSlug(heading)}` : "";
  return `/wiki/${toSlug(target)}${headingHash}`;
}

function toAssetHref(target: string): string {
  return `/content-assets/${encodeAssetPath(target)}`;
}

/**
 * Extract [[wiki-links]] from content. Image embeds are asset references, not graph edges.
 */
function extractWikiLinks(content: string): string[] {
  const wikiLinkRegex = /(?<!!)\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const rawTarget = match[1];
    if (!rawTarget) continue;

    const { target } = parseObsidianTarget(rawTarget);
    if (target.length > 0) links.push(target);
  }

  return [...new Set(links)];
}

function transformObsidianEmbeds(content: string): string {
  return content.replaceAll(/!\[\[([^\]]+)\]\]/gu, (_, rawValue: string) => {
    const { target, label } = parseObsidianTarget(rawValue);
    if (!isImagePath(target)) {
      const text = label && label.length > 0 ? label : target;
      return `[${text}](${toWikiHref(target)})`;
    }

    const alt = label && !/^\d+(x\d+)?$/u.test(label) ? label : basename(target);
    return `![${alt}](${toAssetHref(target)})`;
  });
}

function transformObsidianWikiLinks(content: string): string {
  return content.replaceAll(/\[\[([^\]]+)\]\]/gu, (_, rawValue: string) => {
    const { target, heading, label } = parseObsidianTarget(rawValue);
    const text =
      label && label.length > 0
        ? label
        : heading && heading.length > 0
          ? `${target} > ${heading}`
          : target;
    return `[${text}](${toWikiHref(target, heading)})`;
  });
}

function transformObsidianCallouts(content: string): string {
  const lines = content.split("\n");
  const transformed: string[] = [];

  for (const line of lines) {
    const calloutMatch = line.match(/^> \[!(\w+)\]\s*(.*)$/u);
    if (!calloutMatch) {
      transformed.push(line);
      continue;
    }

    const kind = calloutMatch[1]?.toLowerCase() ?? "note";
    const title = calloutMatch[2]?.trim();
    const label =
      title && title.length > 0 ? `${kind.toUpperCase()}: ${title}` : kind.toUpperCase();
    transformed.push(`> **${label}**`);
  }

  return transformed.join("\n");
}

function transformObsidianMarkdown(content: string): string {
  return transformObsidianWikiLinks(transformObsidianEmbeds(transformObsidianCallouts(content)));
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

const mdxOptions: Options = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: "wrap" }],
    [rehypePrettyCode, { theme: "github-dark" }],
  ],
};

const posts = defineCollection({
  name: "posts",
  directory: "./src/content",
  include: "**/*.md",
  exclude: ["changelog/**", "attachments/**", "Templates/**", "**/.*", "**/.*/**"],
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
    const wikiLinks = extractWikiLinks(document.content);
    const transformedContent = transformObsidianMarkdown(document.content);
    const transformedDocument = { ...document, content: transformedContent };

    const mdx = await compileMDX(context, transformedDocument, mdxOptions);

    const headerImageMatch = transformedContent.match(/!\[([^\]]*)\]\(([^)]+)\)/u);
    const headerImage = headerImageMatch ? headerImageMatch[2] : undefined;

    const excerpt =
      document.content
        .replace(/^---[\s\S]*?---\s*/u, "")
        .replace(/^!\[\[[^\]]+\]\]\s*/u, "")
        .replace(/^!\[[^\]]*\]\([^)]+\)\s*/u, "")
        .split("\n\n")[0]
        ?.replaceAll(
          /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/gu,
          (_, target: string, label: string | undefined) => label ?? target,
        )
        .trim() ?? undefined;

    return {
      ...document,
      slug: document._meta.path,
      excerpt,
      headerImage,
      tableOfContents: extractTableOfContents(transformedContent),
      wikiLinks,
      mdx,
    };
  },
});

const changelog = defineCollection({
  name: "changelog",
  directory: "./src/content/changelog",
  include: "**/*.md",
  schema: z.object({
    title: z.string(),
    published: z.iso.date(),
    draft: z.boolean().default(false),
    category: z.enum(["data", "feature", "improvement", "community"]),
    summary: z.string(),
    content: z.string(),
  }),
  transform: async (document, context) => {
    const transformedDocument = {
      ...document,
      content: transformObsidianMarkdown(document.content),
    };
    const mdx = await compileMDX(context, transformedDocument, mdxOptions);
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
