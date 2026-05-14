import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { Post } from "content-collections";

import { MDXContent } from "@/components/mdx-content";
import { MobileWikiTableOfContents, WikiLayout } from "@/components/wiki-layout";
import { formatPublishedDate } from "@/lib/date";
import { throwRouterError } from "@/lib/router-throws";
import { getWikiPostBySlug, getWikiPosts, getWikiSection } from "@/lib/wiki";

export const Route = createFileRoute("/wiki/$slug")({
  loader: ({ params }: { params: { slug: string } }): Post => {
    const post = getWikiPostBySlug(params.slug);
    if (!post) {
      return throwRouterError(notFound());
    }
    return post;
  },
  component: WikiPage,
});

function WikiPage() {
  const post = Route.useLoaderData();
  const wikiPosts = getWikiPosts();
  const section = getWikiSection(post);
  const displayDate = post.updated ?? post.published;

  return (
    <WikiLayout posts={wikiPosts} currentSlug={post.slug} tableOfContents={post.tableOfContents}>
      <article>
        <header className="mb-8 border-b border-border pb-8">
          <Link to="/wiki" className="text-sm text-muted-foreground hover:text-foreground">
            ← Wiki
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs tracking-[0.16em] text-subtle uppercase">
            <span>{section.label}</span>
            <span aria-hidden="true">/</span>
            <span>Updated {formatPublishedDate(displayDate)}</span>
          </div>
          <h1 className="mt-3 font-serif text-4xl text-foreground italic md:text-5xl">
            {post.title}
          </h1>
          {post.description && (
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {post.description}
            </p>
          )}
        </header>

        <MobileWikiTableOfContents items={post.tableOfContents} />

        <MDXContent code={post.mdx} className="prose-blog prose-wiki prose max-w-none" />

        <footer className="mt-12 border-t border-border pt-6">
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link to="/wiki" className="text-muted-foreground hover:text-foreground">
              ← Wiki Index
            </Link>
            <Link
              to="/graph"
              search={{ focus: `content:${post.slug}` }}
              className="text-muted-foreground hover:text-foreground"
            >
              View in Graph
            </Link>
          </nav>
        </footer>
      </article>
    </WikiLayout>
  );
}
