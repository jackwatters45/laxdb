import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Post } from "content-collections";

import { groupWikiPostsBySection, WIKI_SECTIONS } from "@/lib/wiki";
import { cn } from "@/lib/utils";

type WikiTocItem = Post["tableOfContents"][number];

type WikiLayoutProps = {
  posts: Post[];
  currentSlug?: string;
  tableOfContents?: readonly WikiTocItem[];
  children: ReactNode;
};

export function WikiLayout({
  posts,
  currentSlug,
  tableOfContents = [],
  children,
}: WikiLayoutProps) {
  const groupedPosts = groupWikiPostsBySection(posts);
  const visibleSections = WIKI_SECTIONS.map((section) => ({
    section,
    posts: groupedPosts.get(section) ?? [],
  })).filter(({ posts: sectionPosts }) => sectionPosts.length > 0);

  return (
    <main className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 px-4 py-10 md:px-6 md:py-16 lg:grid-cols-[240px_minmax(0,680px)] xl:grid-cols-[240px_minmax(0,720px)_240px]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-4">
          <Link
            to="/wiki"
            className="mb-5 block font-serif text-lg text-foreground italic transition-colors hover:text-muted-foreground"
          >
            Wiki
          </Link>
          <nav aria-label="Wiki sections" className="space-y-6 border-l border-border/70 pl-4">
            {visibleSections.map(({ section, posts: sectionPosts }) => (
              <section key={section.key}>
                <h2 className="text-xs font-medium tracking-[0.16em] text-subtle uppercase">
                  {section.label}
                </h2>
                {section.description && (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {section.description}
                  </p>
                )}
                <ul className="mt-3 space-y-2.5">
                  {sectionPosts.map((post) => {
                    const active = post.slug === currentSlug;
                    return (
                      <li key={post.slug}>
                        <Link
                          to="/wiki/$slug"
                          params={{ slug: post.slug }}
                          className={cn(
                            "block text-sm leading-5 transition-colors",
                            active
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {post.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <details className="mb-8 rounded-xl border border-border/80 bg-card/40 p-4 lg:hidden">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Browse wiki
          </summary>
          <nav aria-label="Wiki sections" className="mt-4 space-y-5">
            {visibleSections.map(({ section, posts: sectionPosts }) => (
              <section key={section.key}>
                <h2 className="text-xs font-medium tracking-[0.16em] text-subtle uppercase">
                  {section.label}
                </h2>
                <ul className="mt-2 space-y-2">
                  {sectionPosts.map((post) => (
                    <li key={post.slug}>
                      <Link
                        to="/wiki/$slug"
                        params={{ slug: post.slug }}
                        className={cn(
                          "block text-sm transition-colors",
                          post.slug === currentSlug
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        </details>
        {children}
      </div>

      <aside className="hidden xl:block">
        <WikiTableOfContents items={tableOfContents} />
      </aside>
    </main>
  );
}

function WikiTableOfContents({ items }: { items: readonly WikiTocItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto border-l border-border/70 pl-5">
      <h2 className="text-xs font-medium tracking-[0.16em] text-subtle uppercase">On this page</h2>
      <nav aria-label="On this page" className="mt-4">
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.slug} className={item.depth === 3 ? "pl-3" : undefined}>
              <a
                href={`#${item.slug}`}
                className={cn(
                  "block leading-5 text-muted-foreground transition-colors hover:text-foreground",
                  item.depth === 3 ? "text-xs" : "text-sm",
                )}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function MobileWikiTableOfContents({ items }: { items: readonly WikiTocItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <details className="mb-8 rounded-xl border border-border/80 bg-card/40 p-4 xl:hidden">
      <summary className="cursor-pointer text-sm font-medium text-foreground">On this page</summary>
      <nav aria-label="On this page" className="mt-4">
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.slug} className={item.depth === 3 ? "pl-3" : undefined}>
              <a
                href={`#${item.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
