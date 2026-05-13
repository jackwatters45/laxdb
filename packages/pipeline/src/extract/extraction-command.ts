import { Console, Effect } from "effect";

import { getMode } from "./cli-utils";
import type { ExtractionMode } from "./incremental.service";

export interface ExtractionCommandOptions<Manifest, E, R> {
  readonly force: boolean;
  readonly incremental: boolean;
  readonly json: boolean;
  readonly status: boolean;
  readonly statusLabel?: string;
  readonly loadManifest: Effect.Effect<Manifest, E, R>;
  readonly displayStatus: (
    manifest: Manifest,
    json: boolean,
    seasonLabel?: string,
  ) => Effect.Effect<void, E, R>;
  readonly extract: (mode: ExtractionMode) => Effect.Effect<Manifest, E, R>;
}

export const printJson = (value: unknown): Effect.Effect<void> =>
  Console.log(JSON.stringify(value, null, 2));

const displayManifestStatus = <Manifest, E, R>(
  options: ExtractionCommandOptions<Manifest, E, R>,
  manifest: Manifest,
) => {
  if (options.statusLabel === undefined) {
    return options.displayStatus(manifest, options.json);
  }

  return options.displayStatus(manifest, options.json, options.statusLabel);
};

/**
 * Run the shared extraction command mechanics for one league command.
 *
 * The league-specific command stays responsible for flags and choosing which
 * extraction to perform. This helper owns the repeated command policy: status
 * reads, force/incremental mode selection, human mode logging, and JSON output.
 */
export const runExtractionCommand = <Manifest, E, R>(
  options: ExtractionCommandOptions<Manifest, E, R>,
): Effect.Effect<void, E, R> =>
  Effect.gen(function* () {
    if (options.status) {
      const manifest = yield* options.loadManifest;
      yield* displayManifestStatus(options, manifest);
      return;
    }

    const mode = getMode(options.force, options.incremental);

    if (!options.json) {
      yield* Effect.log(`Extraction mode: ${mode}`);
    }

    const manifest = yield* options.extract(mode);

    if (options.json) {
      yield* printJson(manifest);
    }
  });
