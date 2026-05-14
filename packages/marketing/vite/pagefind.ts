/* oxlint-disable typescript/prefer-readonly-parameter-types -- Vite and Pagefind expose mutable plugin/config types. */
import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import type { PagefindServiceConfig } from "pagefind";
import type { Plugin } from "vite";

type PagefindBuildOptions = Readonly<{
  siteDirectory: string;
  outputPath: string;
  index?: Readonly<PagefindServiceConfig>;
  logger?: PagefindLogger;
}>;

type PagefindPluginOptions = Readonly<{
  enabled?: boolean;
  siteDirectory?: string;
  outputPath?: string;
  markerPath?: string;
  index?: Readonly<PagefindServiceConfig>;
}>;

type PagefindOption = boolean | PagefindPluginOptions;

type PagefindLogger = Readonly<{
  info: (message: string) => void;
  error: (message: string) => void;
}>;

function formatDuration(milliseconds: number): string {
  return milliseconds < 750
    ? `${Math.round(milliseconds)}ms`
    : `${(milliseconds / 1000).toFixed(2)}s`;
}

function assertNoPagefindErrors(
  label: string,
  errors: readonly string[],
  logger?: PagefindLogger,
): void {
  if (errors.length === 0) return;

  for (const error of errors) {
    logger?.error(`Pagefind error: ${error}`);
  }

  const details = errors.map((error) => `- ${error}`).join("\n");
  throw new Error(`${label} failed:\n${details}`);
}

function resolveFrom(baseDirectory: string, path: string): string {
  return isAbsolute(path) ? path : resolve(baseDirectory, path);
}

function normalizePagefindOption(option: PagefindOption): PagefindPluginOptions {
  return typeof option === "boolean" ? { enabled: option } : option;
}

export async function buildPagefindIndex(options: PagefindBuildOptions): Promise<void> {
  const pagefind = await import("pagefind");
  const startedAt = performance.now();

  options.logger?.info("Building search index with Pagefind...");

  const created = await pagefind.createIndex(options.index);
  assertNoPagefindErrors("Creating Pagefind index", created.errors, options.logger);

  const index = created.index;
  if (!index) {
    throw new Error("Creating Pagefind index failed: no index returned");
  }

  try {
    const indexed = await index.addDirectory({ path: options.siteDirectory });
    assertNoPagefindErrors("Indexing prerendered HTML", indexed.errors, options.logger);
    options.logger?.info(`Found ${indexed.page_count} HTML files.`);

    const written = await index.writeFiles({ outputPath: options.outputPath });
    assertNoPagefindErrors("Writing Pagefind files", written.errors, options.logger);

    options.logger?.info(
      `Finished building search index in ${formatDuration(performance.now() - startedAt)}.`,
    );
    options.logger?.info(`Wrote Pagefind files to ${written.outputPath}.`);
  } finally {
    await pagefind.close();
  }
}

export function pagefindSearch(pagefindOption: PagefindOption = true): Plugin {
  const options = normalizePagefindOption(pagefindOption);
  let rootDirectory = process.cwd();

  return {
    name: "laxdb:pagefind-search",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      rootDirectory = config.root;
    },
    buildApp: {
      order: "post",
      async handler() {
        if (options.enabled === false) return;

        const siteDirectory = resolveFrom(rootDirectory, options.siteDirectory ?? "dist/client");
        const markerPath = resolveFrom(siteDirectory, options.markerPath ?? "wiki/index.html");
        if (!existsSync(markerPath)) return;

        await buildPagefindIndex({
          siteDirectory,
          outputPath: resolveFrom(siteDirectory, options.outputPath ?? "pagefind"),
          index: options.index,
          logger: {
            info: (message) => {
              console.log(`[pagefind] ${message}`);
            },
            error: (message) => {
              console.error(`[pagefind] ${message}`);
            },
          },
        });
      },
    },
  };
}
