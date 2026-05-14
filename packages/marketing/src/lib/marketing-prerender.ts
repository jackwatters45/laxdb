import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import type { PlatformError } from "effect/PlatformError";

type PrerenderPage = { path: string };
type PrerenderCandidate = { path: string };
type PrerenderServices = FileSystem | Path;

interface MarketingPrerenderConfig {
  pages: PrerenderPage[];
  filter: (candidate: PrerenderCandidate) => boolean;
}

interface MarketingPrerenderOptions {
  rootDirectory: string;
}

const ignoredContentDirectories = new Set(["changelog", "attachments"]);

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

function readContentSlugs(
  contentDirectory: string,
  directory = contentDirectory,
): Effect.Effect<string[], PlatformError, PrerenderServices> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const entries = yield* fs.readDirectory(directory);
    const slugs = yield* Effect.all(
      entries.map((entry) =>
        Effect.gen(function* () {
          const entryPath = path.join(directory, entry);

          if (yield* isIgnoredContentPath(entryPath)) {
            return [];
          }

          const fileInfo = yield* fs.stat(entryPath);

          if (fileInfo.type === "Directory") {
            return yield* readContentSlugs(contentDirectory, entryPath);
          }

          if (fileInfo.type === "File" && (yield* isContentFilePath(entryPath))) {
            return [yield* slugForContentPath(contentDirectory, entryPath)];
          }

          return [];
        }),
      ),
    );

    return slugs.flat();
  });
}

function shouldPrerenderPath(contentPathSet: ReadonlySet<string>, routePath: string) {
  return Effect.gen(function* () {
    const pathname = yield* normalizeRoutePath(routePath);
    return !pathname.startsWith("/content/") || contentPathSet.has(pathname);
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
    const contentSlugs = yield* readContentSlugs(contentDirectory);
    const contentPaths = contentSlugs.map((slug) => `/content/${slug}`);
    const contentPathSet = new Set(contentPaths);
    const services = yield* Effect.context<PrerenderServices>();
    const runWithServices = Effect.runSyncWith(services);

    return {
      pages: contentPaths.map((pagePath) => ({ path: pagePath })),
      filter: ({ path: routePath }: PrerenderCandidate) =>
        runWithServices(shouldPrerenderPath(contentPathSet, routePath)),
    };
  });
}

export const runMarketingPrerenderConfig = (options: MarketingPrerenderOptions) =>
  marketingPrerenderConfig(options).pipe(
    Effect.provide(Layer.merge(NodeFileSystem.layer, NodePath.layer)),
    Effect.runPromise,
  );
