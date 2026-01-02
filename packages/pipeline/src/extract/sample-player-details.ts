/**
 * Sample Player Details Extraction
 *
 * Extracts player details for a small sample to understand the data structure
 * before committing to full extraction (~200 players per year).
 *
 * Usage:
 *   infisical run --env=dev -- bun src/extract/sample-player-details.ts
 *   infisical run --env=dev -- bun src/extract/sample-player-details.ts --count=10
 *   infisical run --env=dev -- bun src/extract/sample-player-details.ts --year=2024 --count=5
 */

import { Effect, Duration } from "effect";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { PLLClient } from "../pll/pll.client";
import type { PLLPlayer, PLLPlayerDetail } from "../pll/pll.schema";
import { ExtractConfigService } from "./extract.config";

const args = process.argv.slice(2);
const yearArg = args.find((a) => a.startsWith("--year="));
const countArg = args.find((a) => a.startsWith("--count="));

const YEAR = yearArg ? parseInt(yearArg.split("=")[1]!, 10) : 2024;
const SAMPLE_COUNT = countArg ? parseInt(countArg.split("=")[1]!, 10) : 5;

const program = Effect.gen(function* () {
  const pll = yield* PLLClient;
  const config = yield* ExtractConfigService;

  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`Player Detail Sample Extraction`);
  yield* Effect.log(`Year: ${YEAR}, Sample size: ${SAMPLE_COUNT}`);
  yield* Effect.log("=".repeat(60) + "\n");

  // Load existing players
  const playersPath = path.join(
    config.outputDir,
    "pll",
    String(YEAR),
    "players.json",
  );

  yield* Effect.log(`Loading players from ${playersPath}...`);

  const playersData = yield* Effect.tryPromise({
    try: () => fs.readFile(playersPath, "utf-8"),
    catch: (e) => new Error(`Failed to read players file: ${String(e)}`),
  });

  const allPlayers = JSON.parse(playersData) as PLLPlayer[];
  yield* Effect.log(`Found ${allPlayers.length} players\n`);

  // Filter players with slugs and sample
  const playersWithSlug = allPlayers.filter((p) => p.slug !== null);

  // Get a diverse sample: high performers, different positions
  const samplePlayers = playersWithSlug
    .filter((p) => (p.stats?.gamesPlayed ?? 0) >= 5) // Players with actual playing time
    .toSorted((a, b) => (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0)) // Sort by goals
    .slice(0, Math.min(SAMPLE_COUNT * 3, playersWithSlug.length)) // Take top performers pool
    .toSorted(() => Math.random() - 0.5) // Shuffle
    .slice(0, SAMPLE_COUNT); // Take sample

  yield* Effect.log(`Selected ${samplePlayers.length} players for sampling:\n`);
  for (const p of samplePlayers) {
    yield* Effect.log(
      `  - ${p.firstName} ${p.lastName} (${p.allTeams[0]?.position ?? "?"}) - ${p.stats?.goals ?? 0} goals, ${p.stats?.gamesPlayed ?? 0} GP`,
    );
  }
  yield* Effect.log("");

  // Extract details for each
  const details: Array<{
    player: PLLPlayer;
    detail: PLLPlayerDetail | null;
    error: string | null;
  }> = [];

  for (const player of samplePlayers) {
    if (!player.slug) continue;

    yield* Effect.log(
      `Fetching detail for ${player.firstName} ${player.lastName}...`,
    );

    const result = yield* pll
      .getPlayerDetail({
        slug: player.slug,
        year: YEAR,
        statsYear: YEAR,
      })
      .pipe(
        Effect.map((detail) => ({
          player,
          detail,
          error: null as string | null,
        })),
        Effect.catchAll((e) =>
          Effect.succeed({
            player,
            detail: null as PLLPlayerDetail | null,
            error: String(e),
          }),
        ),
        Effect.tap(() => Effect.sleep(Duration.millis(200))),
      );

    details.push(result);
  }

  // Save sample output
  const outputPath = path.join(
    config.outputDir,
    "pll",
    "samples",
    `player-details-sample-${YEAR}.json`,
  );

  const outputDir = path.dirname(outputPath);
  yield* Effect.tryPromise({
    try: () => fs.mkdir(outputDir, { recursive: true }),
    catch: (e) => new Error(`Failed to create directory: ${String(e)}`),
  });

  yield* Effect.tryPromise({
    try: () => fs.writeFile(outputPath, JSON.stringify(details, null, 2)),
    catch: (e) => new Error(`Failed to write file: ${String(e)}`),
  });

  yield* Effect.log(`\nSaved sample to ${outputPath}\n`);

  // Analyze the data structure
  yield* Effect.log("=".repeat(60));
  yield* Effect.log(`DATA STRUCTURE ANALYSIS`);
  yield* Effect.log("=".repeat(60) + "\n");

  const successfulDetails = details.filter((d) => d.detail !== null);

  if (successfulDetails.length === 0) {
    yield* Effect.log("No successful detail fetches. Check errors above.");
    return;
  }

  const firstDetail = successfulDetails[0]!.detail!;

  yield* Effect.log(
    `Sample player: ${successfulDetails[0]!.player.firstName} ${successfulDetails[0]!.player.lastName}\n`,
  );

  // careerStats
  if (firstDetail.careerStats) {
    yield* Effect.log(`careerStats: PRESENT`);
    const fields = Object.keys(firstDetail.careerStats);
    yield* Effect.log(`  Fields (${fields.length}): ${fields.join(", ")}`);
  } else {
    yield* Effect.log(`careerStats: NULL`);
  }

  // allSeasonStats
  yield* Effect.log(
    `\nallSeasonStats: ${firstDetail.allSeasonStats.length} entries`,
  );
  if (firstDetail.allSeasonStats.length > 0) {
    const entry = firstDetail.allSeasonStats[0]!;
    yield* Effect.log(
      `  Sample entry: year=${entry.year}, segment=${entry.seasonSegment}, teamId=${entry.teamId}`,
    );
    yield* Effect.log(`  Fields: ${Object.keys(entry).join(", ")}`);

    // Show all years/segments
    const yearSegments = firstDetail.allSeasonStats.map(
      (s) => `${s.year}-${s.seasonSegment}`,
    );
    yield* Effect.log(`  All entries: ${yearSegments.join(", ")}`);
  }

  // accolades
  yield* Effect.log(`\naccolades: ${firstDetail.accolades.length} entries`);
  if (firstDetail.accolades.length > 0) {
    for (const acc of firstDetail.accolades) {
      yield* Effect.log(`  - ${acc.awardName}: ${acc.years.join(", ")}`);
    }
  }

  // advancedSeasonStats
  if (firstDetail.advancedSeasonStats) {
    yield* Effect.log(`\nadvancedSeasonStats: PRESENT`);
    const fields = Object.keys(firstDetail.advancedSeasonStats);
    yield* Effect.log(`  Fields (${fields.length}): ${fields.join(", ")}`);
  } else {
    yield* Effect.log(`\nadvancedSeasonStats: NULL`);
  }

  // champSeries
  if (firstDetail.champSeries) {
    yield* Effect.log(`\nchampSeries: PRESENT`);
    yield* Effect.log(`  position: ${firstDetail.champSeries.position}`);
    yield* Effect.log(
      `  team: ${firstDetail.champSeries.team?.officialId ?? "null"}`,
    );
    yield* Effect.log(
      `  stats: ${firstDetail.champSeries.stats ? "PRESENT" : "NULL"}`,
    );
  } else {
    yield* Effect.log(`\nchampSeries: NULL`);
  }

  // Summary
  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`SUMMARY`);
  yield* Effect.log("=".repeat(60));
  yield* Effect.log(
    `Fetched: ${successfulDetails.length}/${details.length} successful`,
  );
  yield* Effect.log(`Output: ${outputPath}`);
  yield* Effect.log(``);

  // Value assessment
  yield* Effect.log(`VALUE ASSESSMENT:`);
  yield* Effect.log(
    `  - careerStats: Lifetime totals (useful for career leaderboards)`,
  );
  yield* Effect.log(
    `  - allSeasonStats: Per-year stats (already have via list endpoint for current year)`,
  );
  yield* Effect.log(
    `  - accolades: Awards (All-Star, MVP, etc.) - UNIQUE to detail endpoint`,
  );
  yield* Effect.log(
    `  - advancedSeasonStats: Advanced metrics (may be same as getAdvancedPlayers)`,
  );
  yield* Effect.log(``);
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PLLClient.Default),
    Effect.provide(ExtractConfigService.Default),
  ),
).catch(console.error);
