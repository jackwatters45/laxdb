import { Layer, ServiceMap } from "effect";

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
export class PLLManifestService extends ServiceMap.Service<PLLManifestService>()(
  "PLLManifestService",
  {
    make: createManifestServiceEffect({
      source: "pll",
      seasonManifestSchema: SeasonManifestSchema,
      createEmptySeasonManifest,
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ManifestServiceDependencies),
  );
}
