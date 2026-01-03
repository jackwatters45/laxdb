/**
 * Career Stats Extraction - CLI Script
 *
 * Usage:
 *   infisical run --env=dev -- bun src/extract/extract-career-stats.ts
 *   infisical run --env=dev -- bun src/extract/extract-career-stats.ts --dry-run
 */

import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Duration, Layer, Schema } from "effect";
import { PLLClient } from "../pll/pll.client";
import type { PLLCareerStat } from "../pll/pll.schema";
import { ExtractConfigService } from "./extract.config";

const STAT_TYPES = [
  "points",
  "goals",
  "assists",
  "twoPointGoals",
  "groundBalls",
  "saves",
  "faceoffsWon",
] as const;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const PlayerDetailRef = Schema.Struct({
  slug: Schema.String,
  officialId: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
});

interface CareerStatsResult {
  slug: string | null;
  name: string;
  experience: number | null;
  allYears: number[] | null;
  stats: {
    gamesPlayed: number;
    points: number;
    goals: number;
    onePointGoals: number | null;
    twoPointGoals: number;
    assists: number;
    groundBalls: number;
    saves: number;
    faceoffsWon: number;
  };
  appearedInStats: string[];
  inPlayerDetails: boolean;
  likelySource: "pll" | "mll_or_retired";
  fetchedAt: string;
}

interface ExtractionSummary {
  totalUniquePlayers: number;
  inPlayerDetails: number;
  notInPlayerDetails: number;
  byStatType: Record<string, number>;
  durationMs: number;
  timestamp: string;
}

const PlayerDetailRefArray = Schema.Array(PlayerDetailRef);

const loadPlayerDetails = (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  outputDir: string,
) =>
  Effect.gen(function* () {
    const filePath = path.join(outputDir, "pll", "player-details.json");
    const data = yield* fs.readFileString(filePath, "utf-8");
    const parsed = yield* Effect.try({
      try: () => JSON.parse(data) as unknown,
      catch: (e) =>
        new Error(
          `Failed to parse player details JSON from ${filePath}: ${String(e)}`,
        ),
    });
    const players = yield* Schema.decodeUnknown(PlayerDetailRefArray)(parsed);
    return new Set(players.map((p) => p.slug).filter(Boolean));
  });

const program = Effect.gen(function* () {
  const pll = yield* PLLClient;
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`Career Stats Extraction`);
  yield* Effect.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  yield* Effect.log("=".repeat(60) + "\n");

  const startTime = Date.now();

  yield* Effect.log(`Loading existing player-details for cross-reference...`);
  const existingSlugs = yield* loadPlayerDetails(fs, path, config.outputDir);
  yield* Effect.log(
    `Found ${existingSlugs.size} players in player-details.json\n`,
  );

  const allCareerStats = new Map<string, CareerStatsResult>();
  const statCounts: Record<string, number> = {};

  for (const statType of STAT_TYPES) {
    yield* Effect.log(`Fetching career stats for: ${statType}...`);

    const stats = yield* pll
      .getCareerStats({
        stat: statType,
        limit: 500,
      })
      .pipe(
        Effect.tap((results) =>
          Effect.log(`  Got ${results.length} players for ${statType}`),
        ),
        Effect.catchAll((e) => {
          return Effect.gen(function* () {
            yield* Effect.log(
              `  [ERROR] Failed to fetch ${statType}: ${String(e)}`,
            );
            return [] as readonly PLLCareerStat[];
          });
        }),
      );

    statCounts[statType] = stats.length;

    for (const stat of stats) {
      const key = stat.player.slug ?? stat.player.name;
      const existing = allCareerStats.get(key);

      if (existing) {
        existing.appearedInStats.push(statType);
      } else {
        const inDetails = stat.player.slug
          ? existingSlugs.has(stat.player.slug)
          : false;

        allCareerStats.set(key, {
          slug: stat.player.slug,
          name: stat.player.name,
          experience: stat.player.experience,
          allYears: stat.player.allYears ? [...stat.player.allYears] : null,
          stats: {
            gamesPlayed: stat.gamesPlayed,
            points: stat.points,
            goals: stat.goals,
            onePointGoals: stat.onePointGoals,
            twoPointGoals: stat.twoPointGoals,
            assists: stat.assists,
            groundBalls: stat.groundBalls,
            saves: stat.saves,
            faceoffsWon: stat.faceoffsWon,
          },
          appearedInStats: [statType],
          inPlayerDetails: inDetails,
          likelySource: inDetails ? "pll" : "mll_or_retired",
          fetchedAt: new Date().toISOString(),
        });
      }
    }

    yield* Effect.sleep(Duration.millis(100));
  }

  const results = Array.from(allCareerStats.values());
  const inDetails = results.filter((r) => r.inPlayerDetails);
  const notInDetails = results.filter((r) => !r.inPlayerDetails);

  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`EXTRACTION SUMMARY`);
  yield* Effect.log("=".repeat(60));
  yield* Effect.log(`Total unique players in career stats: ${results.length}`);
  yield* Effect.log(`  - In player-details (PLL): ${inDetails.length}`);
  yield* Effect.log(
    `  - NOT in player-details (MLL/retired): ${notInDetails.length}`,
  );
  yield* Effect.log(`\nBy stat type:`);
  for (const [stat, count] of Object.entries(statCounts)) {
    yield* Effect.log(`  - ${stat}: ${count}`);
  }

  if (notInDetails.length > 0) {
    yield* Effect.log(`\nPlayers NOT in our dataset (likely MLL/retired):`);
    const sorted = [...notInDetails].toSorted(
      (a, b) => b.stats.points - a.stats.points,
    );
    for (const player of sorted.slice(0, 20)) {
      const years = player.allYears?.join(", ") ?? "unknown";
      yield* Effect.log(
        `  - ${player.name} (${player.stats.points} pts, ${player.stats.goals} g) - years: [${years}]`,
      );
    }
    if (sorted.length > 20) {
      yield* Effect.log(`  ... and ${sorted.length - 20} more`);
    }
  }

  if (dryRun) {
    yield* Effect.log(`\nDRY RUN - No files written.`);
    return;
  }

  const outputPath = path.join(config.outputDir, "pll", "career-stats.json");
  const summaryPath = path.join(
    config.outputDir,
    "pll",
    "career-stats-summary.json",
  );

  yield* Effect.log(`\nWriting results...`);

  yield* fs.writeFileString(outputPath, JSON.stringify(results, null, 2));

  const summary: ExtractionSummary = {
    totalUniquePlayers: results.length,
    inPlayerDetails: inDetails.length,
    notInPlayerDetails: notInDetails.length,
    byStatType: statCounts,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };

  yield* fs.writeFileString(summaryPath, JSON.stringify(summary, null, 2));

  yield* Effect.log(`\nOutput written to:`);
  yield* Effect.log(`  - ${outputPath}`);
  yield* Effect.log(`  - ${summaryPath}`);
  yield* Effect.log(`\nDuration: ${Math.round(summary.durationMs / 1000)}s`);
});

const MainLayer = Layer.mergeAll(
  PLLClient.Default,
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
