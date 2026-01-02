/**
 * Extract Remaining PLL Data - CLI Script
 *
 * Usage:
 *   infisical run --env=dev -- bun src/extract/extract-remaining.ts
 *   infisical run --env=dev -- bun src/extract/extract-remaining.ts --events-only
 *   infisical run --env=dev -- bun src/extract/extract-remaining.ts --teams-only
 *   infisical run --env=dev -- bun src/extract/extract-remaining.ts --leaders-only
 *   infisical run --env=dev -- bun src/extract/extract-remaining.ts --dry-run
 */

import { Effect, Duration, Schema } from "effect";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { PLLClient } from "../pll/pll.client";
import {
  PLLStatLeader,
  PLLEvent,
  PLLTeam,
  type PLLEventDetail,
  type PLLTeamDetail,
} from "../pll/pll.schema";
import { ExtractConfigService } from "./extract.config";

const EventSlugRef = Schema.Struct({ slug: Schema.String });
const TeamYearRef = Schema.Struct({
  teamId: Schema.String,
  year: Schema.Number,
});

const StatLeadersDataSchema = Schema.mutable(
  Schema.Record({
    key: Schema.String,
    value: Schema.mutable(
      Schema.Record({
        key: Schema.String,
        value: Schema.mutable(Schema.Array(PLLStatLeader)),
      }),
    ),
  }),
);
type StatLeadersData = typeof StatLeadersDataSchema.Type;

const PLL_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const eventsOnly = args.has("--events-only");
const teamsOnly = args.has("--teams-only");
const leadersOnly = args.has("--leaders-only");
const extractAll = !eventsOnly && !teamsOnly && !leadersOnly;

const saveJson = <T>(filePath: string, data: T) =>
  Effect.tryPromise({
    try: async () => {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    },
    catch: (e) => new Error(`Failed to save ${filePath}: ${String(e)}`),
  });

const loadJsonWithSchema = <A, I>(
  filePath: string,
  schema: Schema.Schema<A, I>,
) =>
  Effect.gen(function* () {
    const data = yield* Effect.tryPromise({
      try: () => fs.readFile(filePath, "utf-8"),
      catch: () => new Error("File not found"),
    });
    const parsed: unknown = JSON.parse(data);
    return yield* Schema.decodeUnknown(schema)(parsed);
  }).pipe(Effect.orElse(() => Effect.succeed(null)));

const program = Effect.gen(function* () {
  const pll = yield* PLLClient;
  const config = yield* ExtractConfigService;

  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`PLL Remaining Data Extraction`);
  yield* Effect.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  yield* Effect.log("=".repeat(60) + "\n");

  const outputDir = path.join(config.outputDir, "pll");

  if (extractAll || eventsOnly) {
    yield* Effect.log(`\n${"=".repeat(40)}`);
    yield* Effect.log(`EVENT DETAILS (Play-by-Play)`);
    yield* Effect.log("=".repeat(40) + "\n");

    const allEvents: Array<{
      event: Schema.Schema.Type<typeof PLLEvent>;
      year: number;
    }> = [];

    for (const year of PLL_YEARS) {
      const eventsPath = path.join(outputDir, String(year), "events.json");
      const events = yield* loadJsonWithSchema(
        eventsPath,
        Schema.Array(PLLEvent),
      );
      if (events) {
        const completed = events.filter(
          (e) => e.eventStatus === 3 && e.slugname,
        );
        for (const event of completed) {
          allEvents.push({ event, year });
        }
        yield* Effect.log(`  ${year}: ${completed.length} completed events`);
      }
    }

    yield* Effect.log(`\nTotal events to extract: ${allEvents.length}`);

    const existingDetailsPath = path.join(outputDir, "event-details.json");
    const existingDetails =
      (yield* loadJsonWithSchema(
        existingDetailsPath,
        Schema.Array(EventSlugRef),
      )) ?? [];
    const existingSlugs = new Set(existingDetails.map((d) => d.slug));

    const eventsToExtract = allEvents.filter(
      (e) => e.event.slugname && !existingSlugs.has(e.event.slugname),
    );
    yield* Effect.log(`Already extracted: ${existingSlugs.size}`);
    yield* Effect.log(`Remaining: ${eventsToExtract.length}`);

    if (dryRun) {
      yield* Effect.log(
        `\nDRY RUN - Would extract ${eventsToExtract.length} events`,
      );
    } else if (eventsToExtract.length > 0) {
      yield* Effect.log(`\nExtracting event details...`);
      yield* Effect.log(
        `Estimated time: ${Math.ceil((eventsToExtract.length * 400) / 1000 / 60)} minutes\n`,
      );

      const results: Array<{
        slug: string;
        year: number;
        detail: PLLEventDetail | null;
        error: string | null;
      }> = existingDetails.map((d) => {
        const existing = d as { slug: string; detail?: PLLEventDetail };
        return {
          slug: existing.slug,
          year: 0,
          detail: existing.detail ?? null,
          error: null,
        };
      });

      let extracted = 0;
      let failed = 0;
      const startTime = Date.now();

      for (let i = 0; i < eventsToExtract.length; i++) {
        const entry = eventsToExtract[i];
        if (!entry) continue;
        const { event, year } = entry;
        const slug = event.slugname;
        if (!slug) continue;

        const result = yield* pll.getEventDetail({ slug }).pipe(
          Effect.map((detail) => ({
            slug,
            year,
            detail,
            error: null as string | null,
          })),
          Effect.catchAll((e) =>
            Effect.succeed({
              slug,
              year,
              detail: null as PLLEventDetail | null,
              error: String(e),
            }),
          ),
          Effect.tap(() => Effect.sleep(Duration.millis(150))),
        );

        results.push(result);

        if (result.detail) {
          extracted++;
        } else {
          failed++;
          yield* Effect.log(`  [FAIL] ${slug}: ${result.error?.slice(0, 100)}`);
        }

        if ((i + 1) % 25 === 0 || i === eventsToExtract.length - 1) {
          const pct = Math.round(((i + 1) / eventsToExtract.length) * 100);
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          yield* Effect.log(
            `  Progress: ${i + 1}/${eventsToExtract.length} (${pct}%) - ${elapsed}s elapsed`,
          );
        }
      }

      yield* saveJson(existingDetailsPath, results);
      yield* Effect.log(
        `\nEvent details: ${extracted} extracted, ${failed} failed`,
      );
      yield* Effect.log(`Output: ${existingDetailsPath}`);
    } else {
      yield* Effect.log(`\nAll events already extracted!`);
    }
  }

  if (extractAll || teamsOnly) {
    yield* Effect.log(`\n${"=".repeat(40)}`);
    yield* Effect.log(`TEAM DETAILS (Coach IDs)`);
    yield* Effect.log("=".repeat(40) + "\n");

    const allTeams: Array<{
      team: Schema.Schema.Type<typeof PLLTeam>;
      year: number;
    }> = [];

    for (const year of PLL_YEARS) {
      const teamsPath = path.join(outputDir, String(year), "teams.json");
      const teams = yield* loadJsonWithSchema(teamsPath, Schema.Array(PLLTeam));
      if (teams) {
        for (const team of teams) {
          allTeams.push({ team, year });
        }
        yield* Effect.log(`  ${year}: ${teams.length} teams`);
      }
    }

    yield* Effect.log(`\nTotal team-year combinations: ${allTeams.length}`);

    const existingDetailsPath = path.join(outputDir, "team-details.json");
    const existingDetails =
      (yield* loadJsonWithSchema(
        existingDetailsPath,
        Schema.Array(TeamYearRef),
      )) ?? [];
    const existingKeys = new Set(
      existingDetails.map((d) => `${d.teamId}-${d.year}`),
    );

    const teamsToExtract = allTeams.filter(
      (t) => !existingKeys.has(`${t.team.officialId}-${t.year}`),
    );
    yield* Effect.log(`Already extracted: ${existingKeys.size}`);
    yield* Effect.log(`Remaining: ${teamsToExtract.length}`);

    if (dryRun) {
      yield* Effect.log(
        `\nDRY RUN - Would extract ${teamsToExtract.length} team details`,
      );
    } else if (teamsToExtract.length > 0) {
      yield* Effect.log(`\nExtracting team details...`);

      const results: Array<{
        teamId: string;
        year: number;
        detail: PLLTeamDetail | null;
        error: string | null;
      }> = existingDetails.map((d) => {
        const existing = d as {
          teamId: string;
          year: number;
          detail?: PLLTeamDetail;
        };
        return {
          teamId: existing.teamId,
          year: existing.year,
          detail: existing.detail ?? null,
          error: null,
        };
      });

      let extracted = 0;
      let failed = 0;
      const startTime = Date.now();

      for (let i = 0; i < teamsToExtract.length; i++) {
        const entry = teamsToExtract[i];
        if (!entry) continue;
        const { team, year } = entry;
        const teamId = team.officialId;

        const result = yield* pll
          .getTeamDetail({
            id: teamId,
            year,
            statsYear: year,
            eventsYear: year,
            includeChampSeries: true,
          })
          .pipe(
            Effect.map((detail) => ({
              teamId,
              year,
              detail,
              error: null as string | null,
            })),
            Effect.catchAll((e) =>
              Effect.succeed({
                teamId,
                year,
                detail: null as PLLTeamDetail | null,
                error: String(e),
              }),
            ),
            Effect.tap(() => Effect.sleep(Duration.millis(150))),
          );

        results.push(result);

        if (result.detail) {
          extracted++;
        } else {
          failed++;
          yield* Effect.log(
            `  [FAIL] ${teamId} ${year}: ${result.error?.slice(0, 100)}`,
          );
        }

        if ((i + 1) % 10 === 0 || i === teamsToExtract.length - 1) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          yield* Effect.log(
            `  Progress: ${i + 1}/${teamsToExtract.length} - ${elapsed}s elapsed`,
          );
        }
      }

      yield* saveJson(existingDetailsPath, results);
      yield* Effect.log(
        `\nTeam details: ${extracted} extracted, ${failed} failed`,
      );
      yield* Effect.log(`Output: ${existingDetailsPath}`);
    } else {
      yield* Effect.log(`\nAll team details already extracted!`);
    }
  }

  if (extractAll || leadersOnly) {
    yield* Effect.log(`\n${"=".repeat(40)}`);
    yield* Effect.log(`STAT LEADERS`);
    yield* Effect.log("=".repeat(40) + "\n");

    const statCategories = [
      "goals",
      "assists",
      "points",
      "groundBalls",
      "causedTurnovers",
      "faceoffPct",
      "saves",
      "savePct",
      "twoPointGoals",
    ];

    const existingPath = path.join(outputDir, "stat-leaders.json");
    const existingLeaders: StatLeadersData = yield* Effect.gen(function* () {
      const data = yield* Effect.tryPromise({
        try: () => fs.readFile(existingPath, "utf-8"),
        catch: () => new Error("File not found"),
      });
      const parsed: unknown = JSON.parse(data);
      return yield* Schema.decodeUnknown(StatLeadersDataSchema)(parsed);
    }).pipe(Effect.orElse(() => Effect.succeed<StatLeadersData>({})));

    const yearsToExtract = PLL_YEARS.filter(
      (year) => !existingLeaders[String(year)],
    );
    yield* Effect.log(
      `Years already extracted: ${PLL_YEARS.length - yearsToExtract.length}`,
    );
    yield* Effect.log(`Years remaining: ${yearsToExtract.length}`);

    if (dryRun) {
      yield* Effect.log(
        `\nDRY RUN - Would extract stat leaders for ${yearsToExtract.length} years`,
      );
    } else if (yearsToExtract.length > 0) {
      yield* Effect.log(`\nExtracting stat leaders...`);

      for (const year of yearsToExtract) {
        yield* Effect.log(`  ${year}...`);
        const yearLeaders: Record<string, PLLStatLeader[]> = {};

        for (const stat of statCategories) {
          const result = yield* pll
            .getStatLeaders({
              year,
              seasonSegment: "regular",
              statList: [stat],
              limit: 20,
            })
            .pipe(
              Effect.catchAll(() =>
                Effect.succeed([] as readonly PLLStatLeader[]),
              ),
              Effect.tap(() => Effect.sleep(Duration.millis(100))),
            );

          yearLeaders[stat] = [...result];
        }

        existingLeaders[String(year)] = yearLeaders;
        yield* Effect.log(`    ✓ ${statCategories.length} stat categories`);
      }

      yield* saveJson(existingPath, existingLeaders);
      yield* Effect.log(
        `\nStat leaders extracted for ${yearsToExtract.length} years`,
      );
      yield* Effect.log(`Output: ${existingPath}`);
    } else {
      yield* Effect.log(`\nAll stat leaders already extracted!`);
    }
  }

  yield* Effect.log(`\n${"=".repeat(60)}`);
  yield* Effect.log(`EXTRACTION COMPLETE`);
  yield* Effect.log("=".repeat(60));
});

await Effect.runPromise(
  program.pipe(
    Effect.provide(PLLClient.Default),
    Effect.provide(ExtractConfigService.Default),
  ),
).catch(console.error);
