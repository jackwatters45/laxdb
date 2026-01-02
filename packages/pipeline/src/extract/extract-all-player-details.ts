/**
 * Full Player Details Extraction - CLI Script
 *
 * Usage:
 *   infisical run --env=dev -- bun src/extract/extract-all-player-details.ts
 *   infisical run --env=dev -- bun src/extract/extract-all-player-details.ts --dry-run
 *   infisical run --env=dev -- bun src/extract/extract-all-player-details.ts --limit=10
 */

import { Effect, Duration, Schema } from "effect";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { PLLClient } from "../pll/pll.client";
import { PLLPlayer, PLLPlayerDetail } from "../pll/pll.schema";
import { ExtractConfigService } from "./extract.config";

const PLL_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1] ?? "", 10) : null;

const PlayerDetailResult = Schema.Struct({
  slug: Schema.String,
  officialId: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  detail: Schema.NullOr(PLLPlayerDetail),
  error: Schema.NullOr(Schema.String),
  fetchedAt: Schema.String,
});
type PlayerDetailResult = typeof PlayerDetailResult.Type;

interface ExtractionSummary {
  totalUniquePlayers: number;
  extracted: number;
  failed: number;
  skipped: number;
  durationMs: number;
  timestamp: string;
}

const PlayerDetailResultArray = Schema.Array(PlayerDetailResult);

const loadExistingResults = (outputPath: string) =>
  Effect.gen(function* () {
    const data = yield* Effect.tryPromise({
      try: () => fs.readFile(outputPath, "utf-8"),
      catch: (e) => new Error(`Failed to read existing results: ${String(e)}`),
    });
    const parsed: unknown = JSON.parse(data);
    return yield* Schema.decodeUnknown(PlayerDetailResultArray)(parsed);
  }).pipe(Effect.orElse(() => Effect.succeed([])));

const program = Effect.gen(function* () {
  const pll = yield* PLLClient;
  const config = yield* ExtractConfigService;

  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`Full Player Details Extraction`);
  yield* Effect.log(
    `Mode: ${dryRun ? "DRY RUN" : "LIVE"}${LIMIT ? ` (limit: ${LIMIT})` : ""}`,
  );
  yield* Effect.log("=".repeat(60) + "\n");

  const startTime = Date.now();

  yield* Effect.log(`Loading players from all years...`);

  const PLLPlayerArray = Schema.Array(PLLPlayer);

  const allPlayersMap = new Map<
    string,
    { player: Schema.Schema.Type<typeof PLLPlayer>; years: number[] }
  >();

  for (const year of PLL_YEARS) {
    const playersPath = path.join(
      config.outputDir,
      "pll",
      String(year),
      "players.json",
    );

    const playersData = yield* Effect.tryPromise({
      try: () => fs.readFile(playersPath, "utf-8"),
      catch: () => "[]",
    });

    const parsed: unknown = JSON.parse(playersData);
    const players = yield* Schema.decodeUnknown(PLLPlayerArray)(parsed).pipe(
      Effect.orElse(() => Effect.succeed([])),
    );

    for (const player of players) {
      if (!player.slug) continue;

      const existing = allPlayersMap.get(player.slug);
      if (existing) {
        existing.years.push(year);
        const maxExistingYear = Math.max(
          ...existing.years.filter((y) => y !== year),
        );
        if (year > maxExistingYear) {
          existing.player = player;
        }
      } else {
        allPlayersMap.set(player.slug, { player, years: [year] });
      }
    }

    yield* Effect.log(`  ${year}: ${players.length} players loaded`);
  }

  const uniquePlayers = Array.from(allPlayersMap.values());
  yield* Effect.log(`\nTotal unique players: ${uniquePlayers.length}`);

  const outputPath = path.join(config.outputDir, "pll", "player-details.json");
  const summaryPath = path.join(
    config.outputDir,
    "pll",
    "player-details-summary.json",
  );

  const existingResults = yield* loadExistingResults(outputPath);
  const existingSlugs = new Set<string>();

  for (const r of existingResults) {
    if (r.detail !== null) {
      existingSlugs.add(r.slug);
    }
  }

  if (existingSlugs.size > 0) {
    yield* Effect.log(`Found ${existingSlugs.size} already extracted players`);
  }

  const playersToExtract = uniquePlayers.filter(
    (p) => p.player.slug && !existingSlugs.has(p.player.slug),
  );

  if (LIMIT) {
    playersToExtract.splice(LIMIT);
  }

  yield* Effect.log(`Players to extract: ${playersToExtract.length}`);

  if (dryRun) {
    yield* Effect.log(`\nDRY RUN - Would extract the following players:`);
    for (const { player, years } of playersToExtract.slice(0, 20)) {
      yield* Effect.log(
        `  - ${player.firstName} ${player.lastName} (${player.slug}) - years: ${years.join(", ")}`,
      );
    }
    if (playersToExtract.length > 20) {
      yield* Effect.log(`  ... and ${playersToExtract.length - 20} more`);
    }
    return;
  }

  if (playersToExtract.length === 0) {
    yield* Effect.log(`\nAll players already extracted!`);
    return;
  }

  yield* Effect.log(`\nExtracting player details...`);
  yield* Effect.log(
    `Estimated time: ${Math.ceil((playersToExtract.length * 150) / 1000 / 60)} minutes\n`,
  );

  const results: PlayerDetailResult[] = [...existingResults];
  let extracted = 0;
  let failed = 0;

  for (let i = 0; i < playersToExtract.length; i++) {
    const entry = playersToExtract[i];
    if (!entry) continue;
    const { player, years } = entry;
    const slug = player.slug;
    if (!slug) continue;
    const queryYear = Math.max(...years);

    const result = yield* pll
      .getPlayerDetail({
        slug,
        year: queryYear,
        statsYear: queryYear,
      })
      .pipe(
        Effect.map(
          (detail): PlayerDetailResult => ({
            slug,
            officialId: player.officialId,
            firstName: player.firstName,
            lastName: player.lastName,
            detail,
            error: null,
            fetchedAt: new Date().toISOString(),
          }),
        ),
        Effect.catchAll((e) =>
          Effect.succeed({
            slug,
            officialId: player.officialId,
            firstName: player.firstName,
            lastName: player.lastName,
            detail: null,
            error: String(e),
            fetchedAt: new Date().toISOString(),
          } as PlayerDetailResult),
        ),
        Effect.tap(() => Effect.sleep(Duration.millis(100))),
      );

    results.push(result);

    if (result.detail) {
      extracted++;
    } else {
      failed++;
      yield* Effect.log(
        `  [FAIL] ${player.firstName} ${player.lastName}: ${result.error}`,
      );
    }

    if ((i + 1) % 50 === 0 || i === playersToExtract.length - 1) {
      const pct = Math.round(((i + 1) / playersToExtract.length) * 100);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      yield* Effect.log(
        `  Progress: ${i + 1}/${playersToExtract.length} (${pct}%) - ${elapsed}s elapsed`,
      );
    }
  }

  yield* Effect.log(`\nSaving results...`);

  yield* Effect.tryPromise({
    try: () => fs.writeFile(outputPath, JSON.stringify(results, null, 2)),
    catch: (e) => new Error(`Failed to write results: ${String(e)}`),
  });

  const summary: ExtractionSummary = {
    totalUniquePlayers: uniquePlayers.length,
    extracted: existingSlugs.size + extracted,
    failed,
    skipped: existingSlugs.size,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };

  yield* Effect.tryPromise({
    try: () => fs.writeFile(summaryPath, JSON.stringify(summary, null, 2)),
    catch: (e) => new Error(`Failed to write summary: ${String(e)}`),
  });

  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`EXTRACTION COMPLETE`);
  yield* Effect.log("=".repeat(60));
  yield* Effect.log(`Total unique players: ${uniquePlayers.length}`);
  yield* Effect.log(`Previously extracted: ${existingSlugs.size}`);
  yield* Effect.log(`Newly extracted: ${extracted}`);
  yield* Effect.log(`Failed: ${failed}`);
  yield* Effect.log(`Duration: ${Math.round(summary.durationMs / 1000)}s`);
  yield* Effect.log(`Output: ${outputPath}`);

  const successfulResults = results.filter((r) => r.detail !== null);
  const playersWithAccolades = successfulResults.filter(
    (r) => r.detail?.accolades && r.detail.accolades.length > 0,
  );

  yield* Effect.log(`\nAccolades summary:`);
  yield* Effect.log(`  Players with accolades: ${playersWithAccolades.length}`);

  const awardCounts = new Map<string, number>();
  for (const r of playersWithAccolades) {
    for (const acc of r.detail?.accolades ?? []) {
      const current = awardCounts.get(acc.awardName) ?? 0;
      awardCounts.set(acc.awardName, current + acc.years.length);
    }
  }

  yield* Effect.log(`  Award counts:`);
  const sortedAwards = Array.from(awardCounts.entries()).toSorted(
    (a, b) => b[1] - a[1],
  );
  for (const [award, count] of sortedAwards.slice(0, 10)) {
    yield* Effect.log(`    - ${award}: ${count}`);
  }
});

await Effect.runPromise(
  program.pipe(
    Effect.provide(PLLClient.Default),
    Effect.provide(ExtractConfigService.Default),
  ),
).catch(console.error);
