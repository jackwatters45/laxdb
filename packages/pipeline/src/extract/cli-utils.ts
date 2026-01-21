import { Options } from "@effect/cli";

import type { ExtractionMode } from "./incremental.service";

/** Shared CLI option for force/full extraction mode. */
export const forceOption = Options.boolean("force").pipe(
  Options.withAlias("f"),
  Options.withDescription("Re-extract everything (mode: full)"),
  Options.withDefault(false),
);

/** Shared CLI option for incremental extraction mode. */
export const incrementalOption = Options.boolean("incremental").pipe(
  Options.withAlias("i"),
  Options.withDescription(
    "Re-extract stale data - 24h for current seasons (mode: incremental)",
  ),
  Options.withDefault(false),
);

/** Shared CLI option for JSON output (machine-readable). */
export const jsonOption = Options.boolean("json").pipe(
  Options.withAlias("j"),
  Options.withDescription("Output results as JSON (machine-readable)"),
  Options.withDefault(false),
);

/** Shared CLI option for status query. */
export const statusOption = Options.boolean("status").pipe(
  Options.withDescription("Show extraction status from manifest"),
  Options.withDefault(false),
);

/** Derive extraction mode from CLI options. */
export const getMode = (
  force: boolean,
  incremental: boolean,
): ExtractionMode => {
  if (force) return "full";
  if (incremental) return "incremental";
  return "skip-existing";
};
