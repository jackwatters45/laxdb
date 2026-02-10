import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { allPosts } from "content-collections";

import { formatPublishedDate } from "@/lib/date";
import { getContentByTag, getContentByTags } from "@/lib/graph-utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "opinion", label: "Opinion" },
  { key: "wiki", label: "Wiki" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export const Route = createFileRoute("/blog/")({
  validateSearch: (search: Record<string, unknown>) => ({
    filter: (FILTERS.some((f) => f.key === search.filter) ? search.filter : undefined) as
      | FilterKey
      | undefined,
  }),
  component: BlogIndex,
});

function getFilteredPosts(filter: FilterKey) {
  switch (filter) {
    case "opinion":
      return getContentByTags(allPosts, ["blog", "opinion"]);
    case "wiki":
      return getContentByTags(allPosts, ["blog", "wiki"], ["opinion"]);
    default:
      return getContentByTag(allPosts, "blog");
  }
}

function BlogIndex() {
  const { filter: searchFilter } = Route.useSearch();
  const filter = searchFilter ?? "all";
  const navigate = useNavigate();

  const filteredPosts = getFilteredPosts(filter);
  const sortedPosts = [...filteredPosts].toSorted(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );

  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <header className="mb-10">
        <h1 className="font-serif text-2xl text-foreground italic">Blog</h1>
        <nav className="mt-5 flex items-baseline gap-5 border-b border-border">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() =>
                  navigate({
                    to: "/blog",
                    search: { filter: f.key === "all" ? undefined : f.key },
                  })
                }
                className={`relative pb-2.5 text-sm tracking-wide transition-colors ${
                  active ? "text-foreground" : "text-subtle hover:text-muted"
                }`}
              >
                {f.label}
                {active && <span className="absolute inset-x-0 -bottom-px h-px bg-foreground" />}
              </button>
            );
          })}
        </nav>
      </header>
      {sortedPosts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
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
                    <span className="text-xs text-subtle">
                      {formatPublishedDate(post.published)}
                    </span>
                    {post.tags && post.tags.some((t) => t !== "blog") && (
                      <span className="text-xs text-subtle">
                        · {post.tags.filter((t) => t !== "blog").join(", ")}
                      </span>
                    )}
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
