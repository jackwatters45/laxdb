import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { allPosts } from "content-collections";

import { formatPublishedDate } from "@/lib/date";
import { getContentByTag } from "@/lib/graph-utils";
import { ROUTING_TAGS, ROUTING_TAG_REDIRECTS } from "@/lib/tags";

export const Route = createFileRoute("/tag/$tagId")({
  beforeLoad: ({ params }) => {
    const tagId = params.tagId.toLowerCase();
    const redirectTo = ROUTING_TAG_REDIRECTS[tagId];
    if (redirectTo) {
      throw redirect({ to: redirectTo });
    }
  },
  loader: ({ params }: { params: { tagId: string } }) => {
    const tagId = params.tagId.toLowerCase();
    const posts = getContentByTag(allPosts, tagId);
    if (posts.length === 0) {
      throw notFound();
    }
    return { tagId, posts };
  },
  component: TagPage,
});

function TagPage() {
  const { tagId, posts } = Route.useLoaderData();
  const sortedPosts = [...posts].toSorted(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );

  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <header className="mb-8">
        <Link to="/blog" className="text-sm text-muted hover:text-foreground">
          ← Back
        </Link>
        <h1 className="mt-2 font-serif text-2xl text-foreground italic">#{tagId}</h1>
        <p className="mt-2 text-sm text-muted">
          {sortedPosts.length} {sortedPosts.length === 1 ? "post" : "posts"} tagged with {tagId}
        </p>
      </header>
      <ul className="space-y-6">
        {sortedPosts.map((post) => (
          <li key={post.slug}>
            <Link to="/content/$slug" params={{ slug: post.slug }} className="group block">
              <article className="border-b border-border pb-6 transition-colors">
                <h2 className="font-serif text-lg text-foreground italic group-hover:text-muted">
                  {post.title}
                </h2>
                {post.excerpt && <p className="mt-2 text-sm text-muted">{post.excerpt}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-subtle">{formatPublishedDate(post.published)}</span>
                  {post.tags && post.tags.some((t) => t !== tagId) && (
                    <span className="text-xs text-subtle">
                      · {post.tags.filter((t) => t !== tagId && !ROUTING_TAGS.has(t)).join(", ")}
                    </span>
                  )}
                </div>
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
