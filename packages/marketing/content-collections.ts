// content-collections.ts
import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import matter from "gray-matter";

function extractFrontMatter(content: string) {
  const { data, content: body, excerpt } = matter(content, { excerpt: true });
  return { data, body, excerpt: excerpt ?? "" };
}

const posts = defineCollection({
  name: "posts",
  directory: "./src/content",
  include: "*.md",
  schema: z.object({
    title: z.string(),
    published: z.iso.date(),
    description: z.string().optional(),
    authors: z.array(z.string()),
    content: z.string(),
  }),
  transform: (post) => {
    const frontMatter = extractFrontMatter(post.content);

    // Extract header image (first image in the document)
    const headerImageMatch = post.content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    const headerImage = headerImageMatch ? headerImageMatch[2] : undefined;

    return {
      ...post,
      slug: post._meta.path,
      excerpt: frontMatter.excerpt,
      description: frontMatter.data.description,
      headerImage,
      content: frontMatter.body,
    };
  },
});

export default defineConfig({
  collections: [posts],
});
