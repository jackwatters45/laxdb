/* oxlint-disable typescript/prefer-readonly-parameter-types -- Browser event and observer interfaces are mutable platform types. */
import { useEffect, useState } from "react";

import { guidePages, type GuidePage } from "./pages";

const initialPage = guidePages[0];

function getCurrentPath() {
  const path = window.location.pathname.replace(/\/+$/u, "") || "/";
  return path === "/index.html" ? "/" : path;
}

function useGuidePath() {
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    const handlePopState = () => {
      setPath(getCurrentPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return [path, setPath] as const;
}

function useActiveSection(page: GuidePage) {
  const [activeId, setActiveId] = useState(page.sections[0]?.id ?? "");

  useEffect(() => {
    const sections: HTMLElement[] = [];
    for (const { id } of page.sections) {
      const section = document.querySelector<HTMLElement>(`#${id}`);
      if (section) sections.push(section);
    }

    let frameId = 0;
    const updateActiveSection = () => {
      frameId = 0;
      const activationLine = Math.max(140, window.innerHeight * 0.36);
      let nextId = sections[0]?.id ?? "";

      for (const section of sections) {
        if (section.getBoundingClientRect().top > activationLine) break;
        nextId = section.id;
      }

      setActiveId(nextId);
    };
    const scheduleUpdate = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(updateActiveSection);
    };

    const hashId = decodeURIComponent(window.location.hash.slice(1));
    const hashSection = sections.find((section) => section.id === hashId);
    if (hashSection) {
      const rootStyle = window.getComputedStyle(document.documentElement);
      const sectionStyle = window.getComputedStyle(hashSection);
      const scrollPadding = Number.parseFloat(rootStyle.scrollPaddingTop) || 0;
      const scrollMargin = Number.parseFloat(sectionStyle.scrollMarginTop) || 0;
      const targetTop =
        window.scrollY +
        hashSection.getBoundingClientRect().top -
        scrollPadding -
        scrollMargin;
      window.scrollTo({ top: targetTop, behavior: "instant" });
    }

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
    };
  }, [page]);

  return activeId;
}

function TimelineNav({
  page,
  activeId,
}: Readonly<{ page: GuidePage; activeId: string }>) {
  return (
    <aside
      className="guide-rail"
      id="rules-guide-navigation"
      aria-label="Rules guide navigation"
    >
      <nav className="timeline-nav" aria-label="Rules guide">
        {guidePages.map((guidePage) => {
          const isCurrentPage = guidePage.path === page.path;
          return (
            <div className="timeline-page-group" key={guidePage.path}>
              <a
                className={
                  isCurrentPage
                    ? "timeline-page-item is-active"
                    : "timeline-page-item"
                }
                href={guidePage.path}
                aria-current={isCurrentPage ? "page" : undefined}
              >
                <span>{guidePage.number}</span>
                <strong>{guidePage.navLabel}</strong>
              </a>
              {isCurrentPage ? (
                <div className="timeline-subnav">
                  {page.sections.map((section) => (
                    <a
                      className={
                        section.id === activeId
                          ? "timeline-item is-active"
                          : "timeline-item"
                      }
                      href={`#${section.id}`}
                      aria-current={
                        section.id === activeId ? "location" : undefined
                      }
                      key={section.id}
                    >
                      {section.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileTimeline({
  page,
  activeId,
}: Readonly<{ page: GuidePage; activeId: string }>) {
  return (
    <details className="mobile-timeline">
      <summary>
        <strong>{page.navLabel}</strong>
        <i aria-hidden="true">+</i>
      </summary>
      <div className="mobile-menu-content">
        <nav aria-label="Rules guide">
          {guidePages.map((guidePage) => {
            const isCurrentPage = guidePage.path === page.path;
            return (
              <div className="mobile-page-group" key={guidePage.path}>
                <a
                  className={isCurrentPage ? "is-active" : undefined}
                  href={guidePage.path}
                  aria-current={isCurrentPage ? "page" : undefined}
                >
                  <span>{guidePage.number}</span>
                  <strong>{guidePage.navLabel}</strong>
                </a>
                {isCurrentPage ? (
                  <div className="mobile-page-subnav">
                    {page.sections.map((section) => (
                      <a
                        className={
                          section.id === activeId ? "is-active" : undefined
                        }
                        href={`#${section.id}`}
                        aria-current={
                          section.id === activeId ? "location" : undefined
                        }
                        key={section.id}
                      >
                        {section.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </details>
  );
}

export function App() {
  const [path, setPath] = useGuidePath();
  const [isRailOpen, setIsRailOpen] = useState(true);
  const page =
    guidePages.find((candidate) => candidate.path === path) ?? initialPage;
  const activeId = useActiveSection(page);

  useEffect(() => {
    document.title = `${page.navLabel} — Women’s Lacrosse Rules`;
  }, [page]);

  return (
    <div
      className={isRailOpen ? "guide-shell" : "guide-shell is-rail-collapsed"}
      onClickCapture={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const target = event.target;
        if (!(target instanceof Element)) return;
        const anchor = target.closest<HTMLAnchorElement>("a[href]");
        if (!anchor || anchor.target || anchor.hash) return;

        const url = new URL(anchor.href, window.location.href);
        const destination = url.pathname.replace(/\/+$/u, "") || "/";
        if (
          url.origin !== window.location.origin ||
          !guidePages.some((candidate) => candidate.path === destination)
        ) {
          return;
        }

        event.preventDefault();
        if (destination === path) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        window.history.pushState({}, "", destination);
        setPath(destination);
        window.scrollTo({ top: 0, behavior: "instant" });
      }}
    >
      <a className="skip-link" href="#guide-content">
        Skip to content
      </a>
      <TimelineNav page={page} activeId={activeId} />
      <MobileTimeline page={page} activeId={activeId} />

      <header className="page-breadcrumb">
        <h1>
          <button
            className="sidebar-toggle"
            type="button"
            aria-controls="rules-guide-navigation"
            aria-expanded={isRailOpen}
            aria-label={
              isRailOpen ? "Hide rules navigation" : "Show rules navigation"
            }
            onClick={() => {
              setIsRailOpen((isOpen) => !isOpen);
            }}
          >
            <span className="sidebar-toggle-icon" aria-hidden="true" />
          </button>
          <span>{page.navLabel}</span>
        </h1>
      </header>

      <main className="article-main" id="guide-content">
        <article>
          <div className="article-content" key={page.path}>
            {page.content}
          </div>
        </article>
      </main>
    </div>
  );
}
