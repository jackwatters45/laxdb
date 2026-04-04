import { Flag } from "effect/unstable/cli";

import type { ExtractionMode } from "./incremental.service";

/** Shared CLI option for force/full extraction mode. */
export const forceOption = Flag.boolean("force").pipe(
  Flag.withAlias("f"),
  Flag.withDescription("Re-extract everything (mode: full)"),
  Flag.withDefault(false),
);

/** Shared CLI option for incremental extraction mode. */
export const incrementalOption = Flag.boolean("incremental").pipe(
  Flag.withAlias("i"),
  Flag.withDescription(
    "Re-extract stale data - 24h for current seasons (mode: incremental)",
  ),
  Flag.withDefault(false),
);

/** Shared CLI option for JSON output (machine-readable). */
export const jsonOption = Flag.boolean("json").pipe(
  Flag.withAlias("j"),
  Flag.withDescription("Output results as JSON (machine-readable)"),
  Flag.withDefault(false),
);

/** Shared CLI option for status query. */
export const statusOption = Flag.boolean("status").pipe(
  Flag.withDescription("Show extraction status from manifest"),
  Flag.withDefault(false),
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
