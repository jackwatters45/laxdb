import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import type { PlatformError } from "effect/PlatformError";

type PrerenderPage = { path: string };
type PrerenderCandidate = { path: string };
type PrerenderServices = FileSystem | Path;

type ContentRoute = {
  slug: string;
  isWiki: boolean;
};

interface MarketingPrerenderConfig {
  pages: PrerenderPage[];
  filter: (candidate: PrerenderCandidate) => boolean;
}

interface MarketingPrerenderOptions {
  rootDirectory: string;
}

const ignoredContentDirectories = new Set(["Templates", "attachments", "changelog"]);

function isIgnoredContentPath(filePath: string) {
  return Effect.gen(function* () {
    const path = yield* Path;
    const basename = path.basename(filePath);

    return ignoredContentDirectories.has(basename) || basename.startsWith(".");
  });
}

const contentExtensions = new Set([".md", ".mdx"]);

function isContentFilePath(filePath: string) {
  return Effect.gen(function* () {
    const path = yield* Path;
    return contentExtensions.has(path.extname(filePath));
  });
}

function normalizeRoutePath(routePath: string) {
  return Effect.gen(function* () {
    const [pathname = routePath] = routePath.split(/[?#]/u);
    return pathname === "/" ? pathname : pathname.replace(/\/$/u, "");
  });
}

function slugForContentPath(contentDirectory: string, filePath: string) {
  return Effect.gen(function* () {
    const path = yield* Path;
    return path
      .relative(contentDirectory, filePath)
      .split(path.sep)
      .join("/")
      .replace(/\.mdx?$/u, "");
  });
}

function contentHasWikiTag(content: string): boolean {
  const frontmatterMatch = /^---\s*([\s\S]*?)\s*---/u.exec(content);
  const frontmatter = frontmatterMatch?.[1];
  if (!frontmatter) return false;

  const tagsBlockMatch = /^tags:\s*\n((?:\s+-\s+[^\n]+\n?)*)/mu.exec(frontmatter);
  if (tagsBlockMatch?.[1]) {
    return tagsBlockMatch[1].split("\n").some((line) => /^\s+-\s+["']?wiki["']?\s*$/u.test(line));
  }

  const inlineTagsMatch = /^tags:\s*\[([^\]]*)\]/mu.exec(frontmatter);
  if (inlineTagsMatch?.[1]) {
    return inlineTagsMatch[1]
      .split(",")
      .some((tag) => tag.trim().replaceAll(/["']/gu, "") === "wiki");
  }

  return /^tags:\s+["']?wiki["']?\s*$/mu.test(frontmatter);
}

function readContentRoutes(
  contentDirectory: string,
  directory = contentDirectory,
): Effect.Effect<ContentRoute[], PlatformError, PrerenderServices> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const entries = yield* fs.readDirectory(directory);
    const routes = yield* Effect.all(
      entries.map((entry) =>
        Effect.gen(function* () {
          const entryPath = path.join(directory, entry);

          if (yield* isIgnoredContentPath(entryPath)) {
            return [];
          }

          const fileInfo = yield* fs.stat(entryPath);

          if (fileInfo.type === "Directory") {
            return yield* readContentRoutes(contentDirectory, entryPath);
          }

          if (fileInfo.type === "File" && (yield* isContentFilePath(entryPath))) {
            const content = yield* fs.readFileString(entryPath, "utf-8");
            return [
              {
                slug: yield* slugForContentPath(contentDirectory, entryPath),
                isWiki: contentHasWikiTag(content),
              },
            ];
          }

          return [];
        }),
      ),
    );

    return routes.flat();
  });
}

function shouldPrerenderPath(
  contentPathSet: ReadonlySet<string>,
  wikiPathSet: ReadonlySet<string>,
  routePath: string,
) {
  return Effect.gen(function* () {
    const pathname = yield* normalizeRoutePath(routePath);
    if (pathname.startsWith("/content/")) return contentPathSet.has(pathname);
    if (pathname.startsWith("/wiki/") && pathname !== "/wiki") return wikiPathSet.has(pathname);
    return true;
  });
}

export function marketingPrerenderConfig({
  rootDirectory,
}: MarketingPrerenderOptions): Effect.Effect<
  MarketingPrerenderConfig,
  PlatformError,
  PrerenderServices
> {
  return Effect.gen(function* () {
    const path = yield* Path;
    const contentDirectory = path.join(rootDirectory, "src/content");
    const contentRoutes = yield* readContentRoutes(contentDirectory);
    const contentPaths = contentRoutes.map(({ slug }) => `/content/${slug}`);
    const wikiPaths = contentRoutes
      .filter(({ isWiki }) => isWiki)
      .map(({ slug }) => `/wiki/${slug}`);
    const contentPathSet = new Set(contentPaths);
    const wikiPathSet = new Set(wikiPaths);
    const services = yield* Effect.context<PrerenderServices>();
    const runWithServices = Effect.runSyncWith(services);

    return {
      pages: [...contentPaths, ...wikiPaths].map((pagePath) => ({ path: pagePath })),
      filter: ({ path: routePath }: PrerenderCandidate) =>
        runWithServices(shouldPrerenderPath(contentPathSet, wikiPathSet, routePath)),
    };
  });
}

export const runMarketingPrerenderConfig = (options: MarketingPrerenderOptions) =>
  marketingPrerenderConfig(options).pipe(
    Effect.provide(Layer.merge(NodeFileSystem.layer, NodePath.layer)),
    Effect.runPromise,
  );
