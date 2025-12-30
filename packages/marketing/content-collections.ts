import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";

const posts = defineCollection({
  name: "posts",
  directory: "./src/content",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    published: z.iso.date(),
    description: z.string().optional(),
    authors: z.array(z.string()),
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
      mdx,
    };
  },
});

export default defineConfig({
  collections: [posts],
});
