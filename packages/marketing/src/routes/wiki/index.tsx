import { createFileRoute, Link } from "@tanstack/react-router";
import { allPosts } from "content-collections";

import { getContentByTag, groupBySubjectTag } from "@/lib/graph-utils";

export const Route = createFileRoute("/wiki/")({
  component: WikiIndex,
});

const SUBJECT_LABELS: Record<string, string> = {
  player: "Players",
  team: "Teams",
  league: "Leagues",
  skill: "Skills & Techniques",
  media: "Media & Coverage",
  event: "Events",
  other: "Other",
};

const SUBJECT_ORDER = ["league", "team", "player", "skill", "media", "event", "other"];

function WikiIndex() {
  const wikiPosts = getContentByTag(allPosts, "wiki");
  const grouped = groupBySubjectTag(wikiPosts);

  // Sort groups by predefined order
  const sortedGroups = SUBJECT_ORDER.filter((key) => grouped[key]?.length).map((key) => ({
    key,
    label: SUBJECT_LABELS[key] ?? key,
    posts: grouped[key] ?? [],
  }));

  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <header className="mb-8">
        <h1 className="font-serif text-2xl text-blog-fg italic">Wiki</h1>
        <p className="mt-2 text-sm text-blog-muted">
          Knowledge base for lacrosse players, teams, leagues, and more.
        </p>
        <nav className="mt-4 flex gap-4 text-sm">
          <Link to="/graph" className="text-blog-muted transition-colors hover:text-blog-fg">
            View Graph →
          </Link>
        </nav>
      </header>

      {sortedGroups.length === 0 ? (
        <p className="text-blog-muted">No wiki content yet.</p>
      ) : (
        <div className="space-y-12">
          {sortedGroups.map(({ key, label, posts }) => (
            <section key={key}>
              <h2 className="mb-4 font-serif text-lg text-blog-fg italic">{label}</h2>
              <ul className="grid gap-3">
                {posts
                  .toSorted((a, b) => a.title.localeCompare(b.title))
                  .map((post) => (
                    <li key={post.slug}>
                      <Link
                        to="/content/$slug"
                        params={{ slug: post.slug }}
                        className="group flex items-baseline justify-between border-b border-blog-border/50 pb-2"
                      >
                        <span className="font-serif text-blog-fg group-hover:text-blog-muted">
                          {post.title}
                        </span>
                        {post.tags && post.tags.some((t) => !["wiki", key].includes(t)) && (
                          <span className="text-xs text-blog-subtle">
                            {post.tags
                              .filter((t) => !["wiki", key].includes(t))
                              .slice(0, 2)
                              .join(", ")}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
