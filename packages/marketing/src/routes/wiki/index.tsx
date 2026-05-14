import { createFileRoute, Link } from "@tanstack/react-router";

import { WikiLayout } from "@/components/wiki-layout";
import { WikiSearch } from "@/components/wiki-search";
import { getWikiPosts, groupWikiPostsBySection, WIKI_SECTIONS } from "@/lib/wiki";

export const Route = createFileRoute("/wiki/")({
  component: WikiIndex,
});

function WikiIndex() {
  const wikiPosts = getWikiPosts();
  const groupedPosts = groupWikiPostsBySection(wikiPosts);
  const visibleSections = WIKI_SECTIONS.map((section) => ({
    section,
    posts: groupedPosts.get(section) ?? [],
  })).filter(({ posts }) => posts.length > 0);

  return (
    <WikiLayout posts={wikiPosts}>
      <header className="mb-10 border-b border-border pb-8">
        <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">LaxDB Wiki</p>
        <h1 className="mt-3 font-serif text-4xl text-foreground italic md:text-5xl">
          Learn lacrosse.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          A field guide for players, parents, coaches, and curious fans. Start with the basics or
          jump into the graph when you want to follow connections across the sport.
        </p>
        <nav className="mt-5 flex flex-wrap gap-4 text-sm">
          <Link
            to="/graph"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            View Graph →
          </Link>
        </nav>
      </header>

      <WikiSearch />

      {visibleSections.length === 0 ? (
        <p className="text-muted-foreground">No wiki content yet.</p>
      ) : (
        <div className="space-y-12">
          {visibleSections.map(({ section, posts }) => (
            <section key={section.key}>
              <div className="mb-4">
                <h2 className="font-serif text-2xl text-foreground italic">{section.label}</h2>
                {section.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                )}
              </div>
              <ul className="grid gap-3">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      to="/wiki/$slug"
                      params={{ slug: post.slug }}
                      className="group block rounded-xl border border-border/70 bg-card/30 p-4 transition-colors hover:border-border hover:bg-card/60"
                    >
                      <span className="font-serif text-lg text-foreground italic group-hover:text-muted-foreground">
                        {post.title}
                      </span>
                      {post.description && (
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {post.description}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </WikiLayout>
  );
}
