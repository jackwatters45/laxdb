import { createMiddleware } from "@tanstack/react-start";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import {
  markdownResponseForContentSlug,
  negotiateAcceptHeader,
  notAcceptableResponse,
  setAcceptVary,
} from "@/lib/accept-markdown";
import { throwRouterError } from "@/lib/router-throws";
import type { Post } from "content-collections";

import { publishedPosts } from "@/lib/posts";

import { formatPublishedDate } from "@/lib/date";
import { MDXContent } from "@/components/mdx-content";

const contentNegotiationMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/content\//u, "");
  const negotiatedContent = negotiateAcceptHeader(request.headers.get("Accept"));

  if (negotiatedContent === "markdown") {
    throw markdownResponseForContentSlug(decodeURIComponent(slug));
  }

  if (negotiatedContent === "not-acceptable") {
    throw notAcceptableResponse();
  }

  const result = await next();
  setAcceptVary(result.response.headers);
  return result;
});

export const Route = createFileRoute("/content/$slug")({
  server: {
    middleware: [contentNegotiationMiddleware],
  },
  loader: ({ params }: { params: { slug: string } }): Post => {
    const post = publishedPosts.find((p) => p.slug === params.slug);
    if (!post) {
      return throwRouterError(notFound());
    }
    return post;
  },
  component: ContentPage,
});

function ContentPage() {
  const post = Route.useLoaderData();

  // Determine content type based on tags
  const isWiki = post.tags?.includes("wiki");
  const isBlog = post.tags?.includes("blog");
  const pagefindDescription = post.description ?? post.excerpt;

  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <article>
        <header className="mb-8">
          <h1 className="font-serif text-2xl text-foreground italic">{post.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            {post.authors && post.authors.length > 0 && <span>{post.authors.join(", ")}</span>}
            <span>{formatPublishedDate(post.published)}</span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to="/tag/$tagId"
                  params={{ tagId: tag }}
                  className="rounded-full bg-border/50 px-2 py-0.5 text-xs text-subtle transition-colors hover:bg-border hover:text-foreground"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>
        <div className="sr-only" data-pagefind-ignore="">
          <span data-pagefind-filter={`type:${isWiki ? "wiki" : "post"}`} />
          {post.tags?.map((tag) => (
            <span key={tag} data-pagefind-filter={`tag:${tag}`} />
          ))}
          {pagefindDescription ? (
            <span data-pagefind-meta="description">{pagefindDescription}</span>
          ) : null}
        </div>
        <div data-pagefind-body="">
          <MDXContent code={post.mdx} className="prose-blog prose max-w-none" />
        </div>
        <footer className="mt-12 border-t border-border pt-6">
          <nav className="flex gap-4 text-sm">
            {isBlog && (
              <Link
                to="/blog"
                search={{ filter: undefined }}
                className="text-muted-foreground hover:text-foreground"
              >
                ← All Blog Posts
              </Link>
            )}
            {isWiki && (
              <Link to="/wiki" className="text-muted-foreground hover:text-foreground">
                ← Wiki Index
              </Link>
            )}
            <Link to="/graph" className="text-muted-foreground hover:text-foreground">
              View Graph
            </Link>
          </nav>
        </footer>
      </article>
    </main>
  );
}
