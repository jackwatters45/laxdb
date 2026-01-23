import { createFileRoute, Link } from "@tanstack/react-router";
import { allPosts } from "content-collections";

import { formatPublishedDate } from "@/lib/date";
import { getContentByTag } from "@/lib/graph-utils";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
});

function BlogIndex() {
  const blogPosts = getContentByTag(allPosts, "blog");
  const sortedPosts = [...blogPosts].toSorted(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );

  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <header className="mb-8">
        <h1 className="font-serif text-2xl text-blog-fg italic">Blog</h1>
        <nav className="mt-4 flex gap-4 text-sm">
          <Link to="/blog/opinion" className="text-blog-muted transition-colors hover:text-blog-fg">
            Opinion
          </Link>
          <Link to="/blog/wiki" className="text-blog-muted transition-colors hover:text-blog-fg">
            Wiki Crossover
          </Link>
        </nav>
      </header>
      <ul className="space-y-6">
        {sortedPosts.map((post) => (
          <li key={post.slug}>
            <Link to="/content/$slug" params={{ slug: post.slug }} className="group block">
              <article className="border-b border-blog-border pb-6 transition-colors">
                <h2 className="font-serif text-lg text-blog-fg italic group-hover:text-blog-muted">
                  {post.title}
                </h2>
                {post.excerpt && <p className="mt-2 text-sm text-blog-muted">{post.excerpt}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-blog-subtle">
                    {formatPublishedDate(post.published)}
                  </span>
                  {post.tags && post.tags.some((t) => t !== "blog") && (
                    <span className="text-xs text-blog-subtle">
                      · {post.tags.filter((t) => t !== "blog").join(", ")}
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
