/**
 * Programmatic API for extraction services.
 *
 * Provides type-safe, Layer-based entry points for invoking extractors
 * without going through the CLI.
 *
 * @example
 * ```typescript
 * import { extractNLL, extractPLL } from "@laxdb/pipeline/extract";
 *
 * // Run extraction with default options
 * const result = await Effect.runPromise(extractNLL({ seasonId: 225 }));
 *
 * // With custom options
 * const result = await Effect.runPromise(
 *   extractNLL({ seasonId: 225, mode: "incremental" })
 * );
 * ```
 */

import { Effect } from "effect";

import type { IncrementalExtractOptions } from "./incremental.service";
import { MLLExtractorService } from "./mll";
import { MSLExtractorService } from "./msl";
import { NLLExtractorService } from "./nll";
import { PLLExtractorService } from "./pll";
import { WLAExtractorService } from "./wla";

export interface ExtractParams extends IncrementalExtractOptions {
  /** Season ID or year to extract */
  seasonId: number;
}

/**
 * Extract NLL data for a season programmatically.
 */
export const extractNLL = ({ seasonId, ...options }: ExtractParams) =>
  Effect.gen(function* () {
    const extractor = yield* NLLExtractorService;
    return yield* extractor.extractSeason(seasonId, options);
  }).pipe(Effect.provide(NLLExtractorService.Default));

/**
 * Extract PLL data for a year programmatically.
 */
export const extractPLL = ({ seasonId: year, ...options }: ExtractParams) =>
  Effect.gen(function* () {
    const extractor = yield* PLLExtractorService;
    return yield* extractor.extractYear(year, options);
  }).pipe(Effect.provide(PLLExtractorService.Default));

/**
 * Extract MLL data for a year programmatically.
 */
export const extractMLL = ({ seasonId: year, ...options }: ExtractParams) =>
  Effect.gen(function* () {
    const extractor = yield* MLLExtractorService;
    return yield* extractor.extractSeason(year, options);
  }).pipe(Effect.provide(MLLExtractorService.Default));

/**
 * Extract MSL data for a season programmatically.
 */
export const extractMSL = ({ seasonId, ...options }: ExtractParams) =>
  Effect.gen(function* () {
    const extractor = yield* MSLExtractorService;
    return yield* extractor.extractSeason(seasonId, options);
  }).pipe(Effect.provide(MSLExtractorService.Default));

/**
 * Extract WLA data for a year programmatically.
 */
export const extractWLA = ({ seasonId: year, ...options }: ExtractParams) =>
  Effect.gen(function* () {
    const extractor = yield* WLAExtractorService;
    return yield* extractor.extractSeason(year, options);
  }).pipe(Effect.provide(WLAExtractorService.Default));
