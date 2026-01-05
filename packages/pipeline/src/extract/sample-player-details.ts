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

import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Duration, Layer, Schema } from "effect";
import { PLLClient } from "../pll/pll.client";
import { PLLPlayer, type PLLPlayerDetail } from "../pll/pll.schema";
import { ExtractConfigService } from "./extract.config";

const args = process.argv.slice(2);
const yearArg = args.find((a) => a.startsWith("--year="));
const countArg = args.find((a) => a.startsWith("--count="));

const YEAR = yearArg ? parseInt(yearArg.split("=")[1] ?? "", 10) : 2024;
const SAMPLE_COUNT = countArg ? parseInt(countArg.split("=")[1] ?? "", 10) : 5;

const program = Effect.gen(function* () {
  const pll = yield* PLLClient;
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`Player Detail Sample Extraction`);
  yield* Effect.log(`Year: ${YEAR}, Sample size: ${SAMPLE_COUNT}`);
  yield* Effect.log("=".repeat(60) + "\n");

  const playersPath = path.join(
    config.outputDir,
    "pll",
    String(YEAR),
    "players.json",
  );

  yield* Effect.log(`Loading players from ${playersPath}...`);

  const playersData = yield* fs.readFileString(playersPath, "utf-8");

  const parsed = yield* Effect.try({
    try: () => JSON.parse(playersData) as unknown,
    catch: (e) =>
      new Error(
        `Failed to parse players JSON from ${playersPath}: ${String(e)}`,
      ),
  });
  const allPlayers = yield* Schema.decodeUnknown(Schema.Array(PLLPlayer))(
    parsed,
  );
  yield* Effect.log(`Found ${allPlayers.length} players\n`);

  const playersWithSlug = allPlayers.filter((p) => p.slug !== null);

  const samplePlayers = playersWithSlug
    .filter((p) => (p.stats?.gamesPlayed ?? 0) >= 5)
    .toSorted((a, b) => (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0))
    .slice(0, Math.min(SAMPLE_COUNT * 3, playersWithSlug.length))
    .toSorted(() => Math.random() - 0.5)
    .slice(0, SAMPLE_COUNT);

  yield* Effect.log(`Selected ${samplePlayers.length} players for sampling:\n`);
  for (const p of samplePlayers) {
    yield* Effect.log(
      `  - ${p.firstName} ${p.lastName} (${p.allTeams[0]?.position ?? "?"}) - ${p.stats?.goals ?? 0} goals, ${p.stats?.gamesPlayed ?? 0} GP`,
    );
  }
  yield* Effect.log("");

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

  const outputPath = path.join(
    config.outputDir,
    "pll",
    "samples",
    `player-details-sample-${YEAR}.json`,
  );

  const outputDir = path.dirname(outputPath);
  yield* fs.makeDirectory(outputDir, { recursive: true });
  yield* fs.writeFileString(outputPath, JSON.stringify(details, null, 2));

  yield* Effect.log(`\nSaved sample to ${outputPath}\n`);

  yield* Effect.log("=".repeat(60));
  yield* Effect.log(`DATA STRUCTURE ANALYSIS`);
  yield* Effect.log("=".repeat(60) + "\n");

  const successfulDetails = details.filter((d) => d.detail !== null);

  if (successfulDetails.length === 0) {
    yield* Effect.log("No successful detail fetches. Check errors above.");
    return;
  }

  const firstSuccess = successfulDetails[0];
  if (!firstSuccess?.detail) {
    yield* Effect.log("No successful detail fetches with data.");
    return;
  }
  const firstDetail = firstSuccess.detail;

  yield* Effect.log(
    `Sample player: ${firstSuccess.player.firstName} ${firstSuccess.player.lastName}\n`,
  );

  if (firstDetail.careerStats) {
    yield* Effect.log(`careerStats: PRESENT`);
    const fields = Object.keys(firstDetail.careerStats);
    yield* Effect.log(`  Fields (${fields.length}): ${fields.join(", ")}`);
  } else {
    yield* Effect.log(`careerStats: NULL`);
  }

  yield* Effect.log(
    `\nallSeasonStats: ${firstDetail.allSeasonStats.length} entries`,
  );
  const firstSeasonStat = firstDetail.allSeasonStats[0];
  if (firstSeasonStat) {
    const entry = firstSeasonStat;
    yield* Effect.log(
      `  Sample entry: year=${entry.year}, segment=${entry.seasonSegment}, teamId=${entry.teamId}`,
    );
    yield* Effect.log(`  Fields: ${Object.keys(entry).join(", ")}`);

    const yearSegments = firstDetail.allSeasonStats.map(
      (s) => `${s.year}-${s.seasonSegment}`,
    );
    yield* Effect.log(`  All entries: ${yearSegments.join(", ")}`);
  }

  yield* Effect.log(
    `\naccolades: ${firstDetail.accolades?.length ?? 0} entries`,
  );
  if (firstDetail.accolades && firstDetail.accolades.length > 0) {
    for (const acc of firstDetail.accolades) {
      yield* Effect.log(`  - ${acc.awardName}: ${acc.years.join(", ")}`);
    }
  }

  if (firstDetail.advancedSeasonStats) {
    yield* Effect.log(`\nadvancedSeasonStats: PRESENT`);
    const fields = Object.keys(firstDetail.advancedSeasonStats);
    yield* Effect.log(`  Fields (${fields.length}): ${fields.join(", ")}`);
  } else {
    yield* Effect.log(`\nadvancedSeasonStats: NULL`);
  }

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

  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`SUMMARY`);
  yield* Effect.log("=".repeat(60));
  yield* Effect.log(
    `Fetched: ${successfulDetails.length}/${details.length} successful`,
  );
  yield* Effect.log(`Output: ${outputPath}`);
  yield* Effect.log(``);

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

const MainLayer = Layer.mergeAll(
  PLLClient.Default,
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
