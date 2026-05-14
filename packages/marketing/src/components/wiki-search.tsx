import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import { cn } from "@/lib/utils";

type PagefindSearchOptions = Readonly<{
  filters?: Readonly<Record<string, string | readonly string[]>>;
}>;

type PagefindRuntimeOptions = Readonly<{
  excerptLength?: number;
}>;

type PagefindSearchFragment = Readonly<{
  url: string;
  content: string;
  plain_excerpt: string;
  filters: Readonly<Record<string, readonly string[]>>;
  meta: Readonly<Record<string, string>>;
}>;

type PagefindSearchResult = Readonly<{
  id: string;
  score: number;
  data: () => Promise<PagefindSearchFragment>;
}>;

type PagefindSearchResponse = Readonly<{
  results: readonly PagefindSearchResult[];
}>;

type PagefindModule = Readonly<{
  options?: (options: PagefindRuntimeOptions) => void | Promise<void>;
  search: (term: string | null, options?: PagefindSearchOptions) => Promise<PagefindSearchResponse>;
}>;

type SearchStatus = "idle" | "typing" | "loading" | "ready" | "error";

type WikiSearchItem = Readonly<{
  id: string;
  score: number;
  title: string;
  url: string;
  excerpt: string;
  tags: readonly string[];
}>;

const minimumQueryLength = 2;
const maximumResults = 8;
const searchDelayMs = 160;

let pagefindPromise: Promise<PagefindModule> | undefined;

function isPagefindModule(value: unknown): value is PagefindModule {
  if (typeof value !== "object" || value === null) return false;

  if (!("search" in value)) return false;

  const search = value.search;
  const options = "options" in value ? value.options : undefined;

  return typeof search === "function" && (options === undefined || typeof options === "function");
}

function loadPagefind(): Promise<PagefindModule> {
  if (!pagefindPromise) {
    const pagefindPath = "/pagefind/pagefind.js";
    pagefindPromise = import(/* @vite-ignore */ pagefindPath).then((module: unknown) => {
      if (isPagefindModule(module)) return module;
      throw new Error("Pagefind module did not expose the expected search API");
    });
  }

  return pagefindPromise;
}

function cleanUrl(url: string): string {
  if (url === "/") return url;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function titleFromFragment(fragment: PagefindSearchFragment): string {
  const title = fragment.meta.title?.trim();
  if (title && title.length > 0) return title;

  const cleanPath = cleanUrl(fragment.url);
  const clean = cleanPath === "/" ? undefined : cleanPath.split("/").at(-1);
  return clean ? clean.replaceAll("-", " ") : "Untitled wiki page";
}

function tagsFromFragment(fragment: PagefindSearchFragment): readonly string[] {
  return (fragment.filters.tag ?? [])
    .filter((tag) => tag !== "wiki")
    .toSorted((a, b) => a.localeCompare(b));
}

async function toWikiSearchItem(result: PagefindSearchResult): Promise<WikiSearchItem> {
  const fragment = await result.data();

  return {
    id: result.id,
    score: result.score,
    title: titleFromFragment(fragment),
    url: fragment.url,
    excerpt: fragment.plain_excerpt || fragment.content.slice(0, 180),
    tags: tagsFromFragment(fragment),
  };
}

export function WikiSearch() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<readonly WikiSearchItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let cancelled = false;
    let timeout: number | undefined;

    if (normalizedQuery.length === 0) {
      setStatus("idle");
      setResults([]);
      setTotalResults(0);
      setErrorMessage(undefined);
    } else if (normalizedQuery.length < minimumQueryLength) {
      setStatus("typing");
      setResults([]);
      setTotalResults(0);
      setErrorMessage(undefined);
    } else {
      timeout = window.setTimeout(() => {
        const runSearch = async () => {
          setStatus("loading");
          setErrorMessage(undefined);

          try {
            const pagefind = await loadPagefind();
            await pagefind.options?.({ excerptLength: 28 });

            const response = await pagefind.search(normalizedQuery, {
              filters: { type: "wiki" },
            });
            const visibleResults = await Promise.all(
              response.results.slice(0, maximumResults).map(toWikiSearchItem),
            );

            if (cancelled) return;

            setResults(visibleResults);
            setTotalResults(response.results.length);
            setStatus("ready");
          } catch (error) {
            if (cancelled) return;

            pagefindPromise = undefined;
            const details = error instanceof Error ? error.message : "Unknown Pagefind error";
            setStatus("error");
            setResults([]);
            setTotalResults(0);
            setErrorMessage(details);
          }
        };

        void runSearch();
      }, searchDelayMs);
    }

    return () => {
      cancelled = true;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [normalizedQuery]);

  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- React owns the synthetic event object.
  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const helperText = useMemo(() => {
    switch (status) {
      case "idle":
        return "Search player, team, league, skill, and concept pages with Pagefind.";
      case "typing":
        return `Type at least ${minimumQueryLength} characters to search.`;
      case "loading":
        return "Searching the static Pagefind index…";
      case "ready":
        return totalResults === 1
          ? "1 matching wiki page."
          : `${totalResults} matching wiki pages.`;
      case "error":
        return "Pagefind search is generated at build time and is unavailable in this session.";
    }

    return "";
  }, [status, totalResults]);

  return (
    <section className="mb-12 rounded-3xl border border-border/70 bg-card/35 p-4 shadow-sm shadow-black/5 md:p-5">
      <label className="font-serif text-lg text-foreground italic" htmlFor="wiki-pagefind-search">
        Search the wiki
      </label>
      <p className="mt-1 text-sm text-muted-foreground">
        Starlight-style static search powered by Pagefind.
      </p>

      <div className="mt-4">
        <input
          id="wiki-pagefind-search"
          value={query}
          onChange={handleQueryChange}
          placeholder="Try “face-off”, “PLL”, or “Ryan Boyle”"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors outline-none placeholder:text-subtle focus:border-foreground/60"
          type="search"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <p className="mt-3 text-xs text-subtle" aria-live="polite">
        {helperText}
      </p>

      {status === "error" && errorMessage ? (
        <p className="mt-2 rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          Run <code className="font-mono">bun run build</code> and preview the built marketing app
          to test the generated index. Details: {errorMessage}
        </p>
      ) : null}

      {status === "ready" && results.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          No wiki pages matched “{normalizedQuery}”. Try a broader lacrosse term.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ol className="mt-5 space-y-3">
          {results.map((result) => (
            <li key={result.id}>
              <a
                href={result.url}
                className="group block rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:border-foreground/30 hover:bg-background"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-base text-foreground italic group-hover:text-muted-foreground">
                    {result.title}
                  </h3>
                  <span className="text-xs text-subtle">{cleanUrl(result.url)}</span>
                </div>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {result.excerpt}
                </p>

                {result.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-subtle",
                          tag === "player" && "border-foreground/20 text-muted-foreground",
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </a>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
