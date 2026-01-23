import { createFileRoute, Link } from "@tanstack/react-router";
import { allPosts } from "content-collections";

import { getContentByTags } from "@/lib/graph-utils";

export const Route = createFileRoute("/blog/opinion")({
  component: BlogOpinion,
});

function BlogOpinion() {
  const opinionPosts = getContentByTags(allPosts, ["blog", "opinion"]);
  const sortedPosts = [...opinionPosts].toSorted(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );

  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <header className="mb-8">
        <Link to="/blog" className="text-sm text-blog-muted hover:text-blog-fg">
          ← Blog
        </Link>
        <h1 className="mt-2 font-serif text-2xl text-blog-fg italic">Opinion</h1>
        <p className="mt-2 text-sm text-blog-muted">
          Commentary and analysis on the state of lacrosse.
        </p>
      </header>
      {sortedPosts.length === 0 ? (
        <p className="text-blog-muted">No opinion pieces yet.</p>
      ) : (
        <ul className="space-y-6">
          {sortedPosts.map((post) => (
            <li key={post.slug}>
              <Link to="/content/$slug" params={{ slug: post.slug }} className="group block">
                <article className="border-b border-blog-border pb-6 transition-colors">
                  <h2 className="font-serif text-lg text-blog-fg italic group-hover:text-blog-muted">
                    {post.title}
                  </h2>
                  {post.excerpt && <p className="mt-2 text-sm text-blog-muted">{post.excerpt}</p>}
                  <span className="mt-2 block text-xs text-blog-subtle">
                    {new Date(post.published).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
