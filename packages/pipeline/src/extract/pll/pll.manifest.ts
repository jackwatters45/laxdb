import { Effect } from "effect";

import {
  type SeasonManifest,
  type EntityStatus,
  SeasonManifest as SeasonManifestSchema,
  createEmptySeasonManifest,
} from "../extract.schema";
import {
  createManifestServiceEffect,
  type ExtractionManifest,
  ManifestServiceDependencies,
} from "../manifest.factory";

// Re-export types for backwards compatibility
export type { SeasonManifest, EntityStatus };
export type PLLExtractionManifest = ExtractionManifest<"pll", SeasonManifest>;

// PLL Manifest Service - uses generic factory
export class PLLManifestService extends Effect.Service<PLLManifestService>()(
  "PLLManifestService",
  {
    effect: createManifestServiceEffect({
      source: "pll",
      seasonManifestSchema: SeasonManifestSchema,
      createEmptySeasonManifest,
    }),
    dependencies: [ManifestServiceDependencies],
  },
) {}
