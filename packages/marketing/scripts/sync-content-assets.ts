/**
 * Sync Obsidian vault attachments into the marketing site's public asset folder.
 *
 * Content authors can write Obsidian embeds such as `![[attachments/diagram.png]]`.
 * `content-collections.ts` rewrites those embeds to `/content-assets/attachments/diagram.png`,
 * so this script copies non-Markdown files from `src/content` into `public/content-assets`
 * before content generation and production builds. Obsidian metadata, templates,
 * changelog notes, and Markdown source files are intentionally ignored.
 */

import { BunRuntime } from "@effect/platform-bun";
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { Console, Effect, FileSystem } from "effect";

const contentDirectory = new URL("../src/content/", import.meta.url).pathname;
const outputDirectory = new URL("../public/content-assets/", import.meta.url).pathname;
const ignoredDirectoryNames = new Set(["Templates", "changelog"]);
const markdownExtensions = new Set([".md", ".mdx"]);

function joinPaths(...segments: readonly string[]): string {
  const joined = segments
    .map((segment) => segment.replaceAll(/^\/+|\/+$/gu, ""))
    .filter((segment) => segment.length > 0)
    .join("/");

  return segments[0]?.startsWith("/") === true ? `/${joined}` : joined;
}

function dirname(path: string): string {
  const segments = path.split("/");
  segments.pop();
  return segments.join("/") || "/";
}

function extension(path: string): string {
  const filename = path.split("/").at(-1) ?? path;
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

function isSyncableAsset(relativePath: string): boolean {
  const segments = relativePath.split("/");
  if (segments.some((segment) => segment.startsWith("."))) return false;
  if (segments.some((segment) => ignoredDirectoryNames.has(segment))) return false;
  return !markdownExtensions.has(extension(relativePath));
}

const syncContentAssets = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(outputDirectory, { recursive: true });

  const paths = yield* fs.readDirectory(contentDirectory, { recursive: true });
  const results = yield* Effect.forEach(
    paths.filter(isSyncableAsset),
    (relativePath) =>
      Effect.gen(function* () {
        const sourcePath = joinPaths(contentDirectory, relativePath);
        const sourceStats = yield* fs.stat(sourcePath);

        if (sourceStats.type !== "File") return 0;

        const destinationPath = joinPaths(outputDirectory, relativePath);
        yield* fs.makeDirectory(dirname(destinationPath), { recursive: true });
        yield* fs.copyFile(sourcePath, destinationPath);

        return 1;
      }),
    { concurrency: 8 },
  );

  let copied = 0;
  for (const result of results) {
    copied += result;
  }

  yield* Console.log(`Synced ${copied} content asset${copied === 1 ? "" : "s"}.`);
});

syncContentAssets.pipe(Effect.provide(BunFileSystem.layer), BunRuntime.runMain);
