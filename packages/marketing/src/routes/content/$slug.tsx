import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { allPosts, type Post } from "content-collections";

import { MDXContent } from "@/components/mdx-content";

export const Route = createFileRoute("/content/$slug")({
  loader: ({ params }: { params: { slug: string } }): Post => {
    const post = allPosts.find((p) => p.slug === params.slug);
    if (!post) {
      throw notFound();
    }
    return post;
  },
  component: ContentPage,
});

function ContentPage() {
  const post = Route.useLoaderData();

  if (!post) {
    throw notFound();
  }

  // Determine content type based on tags
  const isWiki = post.tags?.includes("wiki");
  const isBlog = post.tags?.includes("blog");

  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <article>
        <header className="mb-8">
          <h1 className="font-serif text-2xl text-blog-fg italic">{post.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-blog-muted">
            {post.authors && post.authors.length > 0 && <span>{post.authors.join(", ")}</span>}
            <span>
              {new Date(post.published).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to="/tag/$tagId"
                  params={{ tagId: tag }}
                  className="rounded-full bg-blog-border/50 px-2 py-0.5 text-xs text-blog-subtle transition-colors hover:bg-blog-border hover:text-blog-fg"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>
        <MDXContent code={post.mdx} className="prose-blog prose max-w-none" />
        <footer className="mt-12 border-t border-blog-border pt-6">
          <nav className="flex gap-4 text-sm">
            {isBlog && (
              <Link to="/blog" className="text-blog-muted hover:text-blog-fg">
                ← All Blog Posts
              </Link>
            )}
            {isWiki && (
              <Link to="/wiki" className="text-blog-muted hover:text-blog-fg">
                ← Wiki Index
              </Link>
            )}
            <Link to="/graph" className="text-blog-muted hover:text-blog-fg">
              View Graph
            </Link>
          </nav>
        </footer>
      </article>
    </main>
  );
}
