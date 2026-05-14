/**
 * PLL Data Exploration Script
 *
 * Usage:
 *   infisical run --env=dev -- bun src/pll/explore-data.ts
 *   infisical run --env=dev -- bun src/pll/explore-data.ts --year=2024
 *   infisical run --env=dev -- bun src/pll/explore-data.ts --full
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Clock, Effect, Duration, Layer, Option } from "effect";
import { Command, Flag } from "effect/unstable/cli";

import { formatUnknownError } from "../util";

import { PLLClient } from "./pll.client";
import type { PLLPlayer, PLLTeam, PLLEvent } from "./pll.schema";

const PLL_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

interface YearSummary {
  year: number;
  teams: { count: number; withStats: number; withCoaches: number };
  players: { count: number; withStats: number; withAllTeams: number };
  events: { count: number; completed: number; withScores: number };
  standings: { count: number };
  timing: { teamsMs: number; playersMs: number; eventsMs: number };
}

interface FieldAnalysis {
  field: string;
  populated: number;
  total: number;
  percentage: number;
}

const analyzeFields = <T>(
  items: readonly T[],
  fields: (keyof T)[],
): FieldAnalysis[] => {
  return fields.map((field) => {
    const populated = items.filter((item) => {
      const value = item[field];
      return value !== null && value !== undefined;
    }).length;
    return {
      field: String(field),
      populated,
      total: items.length,
      percentage:
        items.length > 0 ? Math.round((populated / items.length) * 100) : 0,
    };
  });
};

const formatMs = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const exploreYear = (year: number) =>
  Effect.gen(function* () {
    const pll = yield* PLLClient;
    yield* Effect.log(`\n${"=".repeat(60)}`);
    yield* Effect.log(`Exploring PLL ${year}`);
    yield* Effect.log("=".repeat(60));

    const summary: YearSummary = {
      year,
      teams: { count: 0, withStats: 0, withCoaches: 0 },
      players: { count: 0, withStats: 0, withAllTeams: 0 },
      events: { count: 0, completed: 0, withScores: 0 },
      standings: { count: 0 },
      timing: { teamsMs: 0, playersMs: 0, eventsMs: 0 },
    };

    yield* Effect.log("\n📊 Teams:");
    const teamsStart = yield* Clock.currentTimeMillis;
    const teams = yield* pll
      .getTeams({ year, includeChampSeries: true })
      .pipe(Effect.catch(() => Effect.succeed([] as readonly PLLTeam[])));
    summary.timing.teamsMs = (yield* Clock.currentTimeMillis) - teamsStart;
    summary.teams.count = teams.length;
    summary.teams.withStats = teams.filter((t) => t.stats !== null).length;
    summary.teams.withCoaches = teams.filter(
      (t) => t.coaches.length > 0,
    ).length;

    yield* Effect.log(`   Count: ${teams.length}`);
    yield* Effect.log(`   With stats: ${summary.teams.withStats}`);
    yield* Effect.log(`   With coaches: ${summary.teams.withCoaches}`);
    yield* Effect.log(`   Fetch time: ${formatMs(summary.timing.teamsMs)}`);

    if (teams.length > 0) {
      const teamFields = analyzeFields(teams, [
        "officialId",
        "locationCode",
        "location",
        "fullName",
        "urlLogo",
        "slogan",
        "stats",
        "postStats",
        "champSeries",
      ]);
      yield* Effect.log("   Field completeness:");
      for (const field of teamFields.filter(
        (teamField) => teamField.percentage < 100,
      )) {
        yield* Effect.log(
          `     - ${field.field}: ${field.percentage}% (${field.populated}/${field.total})`,
        );
      }
    }

    yield* Effect.log("\n👥 Players:");
    const playersStart = yield* Clock.currentTimeMillis;
    const players = yield* pll
      .getPlayers({
        season: year,
        limit: 500,
      })
      .pipe(
        Effect.catch((e) => {
          return Effect.gen(function* () {
            yield* Effect.log(
              `     ⚠️ Error fetching players: ${formatUnknownError(e)}`,
            );
            return [] as readonly PLLPlayer[];
          });
        }),
      );
    summary.timing.playersMs = (yield* Clock.currentTimeMillis) - playersStart;
    summary.players.count = players.length;
    summary.players.withStats = players.filter(
      (p) => p.stats !== undefined,
    ).length;
    summary.players.withAllTeams = players.filter(
      (p) => p.allTeams.length > 0,
    ).length;

    yield* Effect.log(`   Count: ${players.length}`);
    yield* Effect.log(`   With stats: ${summary.players.withStats}`);
    yield* Effect.log(`   With team history: ${summary.players.withAllTeams}`);
    yield* Effect.log(`   Fetch time: ${formatMs(summary.timing.playersMs)}`);

    if (players.length > 0) {
      const playerFields = analyzeFields(players, [
        "officialId",
        "firstName",
        "lastName",
        "slug",
        "profileUrl",
        "handedness",
        "country",
        "experience",
        "isCaptain",
        "injuryStatus",
        "stats",
        "postStats",
        "champSeries",
      ]);
      yield* Effect.log("   Field completeness:");
      for (const field of playerFields.filter(
        (playerField) => playerField.percentage < 100,
      )) {
        yield* Effect.log(
          `     - ${field.field}: ${field.percentage}% (${field.populated}/${field.total})`,
        );
      }

      const positions = new Map<string, number>();
      for (const p of players) {
        const team = p.allTeams.find((t) => t.year === year);
        const pos = team?.positionName ?? "Unknown";
        positions.set(pos, (positions.get(pos) ?? 0) + 1);
      }
      yield* Effect.log("   Positions:");
      for (const [pos, count] of [...positions.entries()].toSorted(
        (a, b) => b[1] - a[1],
      )) {
        yield* Effect.log(`     - ${pos}: ${count}`);
      }
    }

    yield* Effect.log("\n🎮 Events:");
    const eventsStart = yield* Clock.currentTimeMillis;
    const events = yield* pll
      .getEvents({ year })
      .pipe(Effect.catch(() => Effect.succeed([] as readonly PLLEvent[])));
    summary.timing.eventsMs = (yield* Clock.currentTimeMillis) - eventsStart;
    summary.events.count = events.length;
    summary.events.completed = events.filter((e) => e.eventStatus === 3).length;
    summary.events.withScores = events.filter(
      (e) => e.homeScore !== null && e.visitorScore !== null,
    ).length;

    yield* Effect.log(`   Count: ${events.length}`);
    yield* Effect.log(`   Completed: ${summary.events.completed}`);
    yield* Effect.log(`   With scores: ${summary.events.withScores}`);
    yield* Effect.log(`   Fetch time: ${formatMs(summary.timing.eventsMs)}`);

    if (events.length > 0) {
      const eventFields = analyzeFields(events, [
        "slugname",
        "startTime",
        "venue",
        "homeTeam",
        "awayTeam",
        "homeScore",
        "visitorScore",
        "broadcaster",
        "eventStatus",
      ]);
      yield* Effect.log("   Field completeness:");
      for (const field of eventFields.filter(
        (eventField) => eventField.percentage < 100,
      )) {
        yield* Effect.log(
          `     - ${field.field}: ${field.percentage}% (${field.populated}/${field.total})`,
        );
      }

      const statuses = new Map<number | null, number>();
      for (const e of events) {
        statuses.set(e.eventStatus, (statuses.get(e.eventStatus) ?? 0) + 1);
      }
      yield* Effect.log("   Event statuses:");
      const statusNames: Record<number, string> = {
        1: "Scheduled",
        2: "In Progress",
        3: "Final",
        4: "Cancelled",
        5: "Postponed",
      };
      for (const [status, count] of [...statuses.entries()].toSorted(
        (a, b) => (a[0] ?? 0) - (b[0] ?? 0),
      )) {
        const name = status
          ? (statusNames[status] ?? `Unknown(${status})`)
          : "null";
        yield* Effect.log(`     - ${name}: ${count}`);
      }
    }

    yield* Effect.log("\n📈 Standings:");
    const standings = yield* pll
      .getStandings({ year, champSeries: false })
      .pipe(Effect.catch(() => Effect.succeed([])));
    summary.standings.count = standings.length;
    yield* Effect.log(`   Count: ${standings.length}`);

    return summary;
  });

const exploreDetailEndpoints = (year: number) =>
  Effect.gen(function* () {
    const pll = yield* PLLClient;
    yield* Effect.log(`\n${"=".repeat(60)}`);
    yield* Effect.log(`Exploring Detail Endpoints for ${year}`);
    yield* Effect.log("=".repeat(60));

    const teams = yield* pll
      .getTeams({ year })
      .pipe(Effect.catch(() => Effect.succeed([] as readonly PLLTeam[])));

    if (teams.length === 0) {
      yield* Effect.log("No teams found, skipping detail exploration");
      return;
    }

    const sampleTeam = teams[0];
    if (!sampleTeam) {
      yield* Effect.log("No teams found, skipping team detail exploration");
      return;
    }
    yield* Effect.log(`\n🏟️ Team Detail (${sampleTeam.fullName}):`);
    const teamDetailStart = yield* Clock.currentTimeMillis;
    const teamDetail = yield* pll
      .getTeamDetail({
        id: sampleTeam.officialId,
        year,
        statsYear: year,
        eventsYear: year,
        includeChampSeries: true,
      })
      .pipe(Effect.catch(() => Effect.succeed(null)));
    const teamDetailMs = (yield* Clock.currentTimeMillis) - teamDetailStart;

    if (teamDetail) {
      yield* Effect.log(`   Fetch time: ${formatMs(teamDetailMs)}`);
      yield* Effect.log(`   Events: ${teamDetail.events.length}`);
      yield* Effect.log(`   Coaches: ${teamDetail.coaches.length}`);
      yield* Effect.log(`   All years: ${teamDetail.allYears.join(", ")}`);
      yield* Effect.log(`   Has stats: ${teamDetail.stats !== null}`);
      yield* Effect.log(`   Has post stats: ${teamDetail.postStats !== null}`);
      yield* Effect.log(
        `   Has champSeries: ${teamDetail.champSeries !== undefined}`,
      );
    }

    const players = yield* pll
      .getPlayers({ season: year, limit: 10 })
      .pipe(Effect.catch(() => Effect.succeed([] as readonly PLLPlayer[])));

    const samplePlayer = players[0];
    if (samplePlayer) {
      const slug = samplePlayer.slug;
      if (slug) {
        yield* Effect.log(
          `\n👤 Player Detail (${samplePlayer.firstName} ${samplePlayer.lastName}):`,
        );
        const playerDetailStart = yield* Clock.currentTimeMillis;
        const playerDetail = yield* pll
          .getPlayerDetail({
            slug,
            year,
            statsYear: year,
          })
          .pipe(Effect.catch(() => Effect.succeed(null)));
        const playerDetailMs =
          (yield* Clock.currentTimeMillis) - playerDetailStart;

        if (playerDetail) {
          yield* Effect.log(`   Fetch time: ${formatMs(playerDetailMs)}`);
          yield* Effect.log(
            `   All season stats: ${playerDetail.allSeasonStats.length}`,
          );
          yield* Effect.log(
            `   Accolades: ${playerDetail.accolades?.length ?? 0}`,
          );
          yield* Effect.log(
            `   Has career stats: ${playerDetail.careerStats !== null}`,
          );
          yield* Effect.log(
            `   Has advanced stats: ${playerDetail.advancedSeasonStats !== null}`,
          );

          const seasons = [
            ...new Set(playerDetail.allSeasonStats.map((s) => s.year)),
          ].toSorted((a, b) => a - b);
          yield* Effect.log(`   Seasons with stats: ${seasons.join(", ")}`);
        }
      }
    }

    const events = yield* pll
      .getEvents({ year })
      .pipe(Effect.catch(() => Effect.succeed([] as readonly PLLEvent[])));

    const completedEvent = events.find(
      (e) => e.eventStatus === 3 && e.slugname,
    );
    if (completedEvent?.slugname) {
      yield* Effect.log(`\n🎮 Event Detail (${completedEvent.slugname}):`);
      const eventDetailStart = yield* Clock.currentTimeMillis;
      const eventDetail = yield* pll
        .getEventDetail({ slug: completedEvent.slugname })
        .pipe(Effect.catch(() => Effect.succeed(null)));
      const eventDetailMs = (yield* Clock.currentTimeMillis) - eventDetailStart;

      if (eventDetail) {
        yield* Effect.log(`   Fetch time: ${formatMs(eventDetailMs)}`);
        yield* Effect.log(
          `   Score: ${eventDetail.homeTeam?.locationCode ?? "?"} ${eventDetail.homeScore} - ${eventDetail.visitorScore} ${eventDetail.awayTeam?.locationCode ?? "?"}`,
        );
        yield* Effect.log(`   Play logs: ${eventDetail.playLogs?.length ?? 0}`);
        yield* Effect.log(`   Period: ${eventDetail.period}`);
      }
    }
  });

const yearOption = Flag.integer("year").pipe(
  Flag.withDescription("Explore one PLL season year"),
  Flag.optional,
);

const fullOption = Flag.boolean("full").pipe(
  Flag.withDescription("Include detail endpoint exploration"),
  Flag.withDefault(false),
);

const detailOption = Flag.boolean("detail").pipe(
  Flag.withDescription("Explore detail endpoints for the selected year"),
  Flag.withDefault(false),
);

const main = Effect.gen(function* () {
  const command = Command.make(
    "pll-explore",
    { year: yearOption, full: fullOption, detail: detailOption },
    ({ year, full, detail }) =>
      Effect.gen(function* () {
        const yearValue = Option.getOrNull(year);

        yield* Effect.log("🏈 PLL Data Exploration");
        yield* Effect.log("========================\n");

        const summaries: YearSummary[] = [];

        if (yearValue !== null) {
          if (yearValue < 2019 || yearValue > 2030) {
            yield* Effect.log(`Invalid year: ${yearValue}. Must be 2019-2030.`);
            return;
          }
          const summary = yield* exploreYear(yearValue);
          summaries.push(summary);

          if (detail || full) {
            yield* exploreDetailEndpoints(yearValue);
          }
        } else {
          for (const pllYear of PLL_YEARS) {
            const summary = yield* exploreYear(pllYear);
            summaries.push(summary);
            yield* Effect.sleep(Duration.millis(500));
          }

          if (full) {
            yield* exploreDetailEndpoints(2024);
          }
        }

        yield* Effect.log(`\n${"=".repeat(60)}`);
        yield* Effect.log("SUMMARY");
        yield* Effect.log("=".repeat(60));
        yield* Effect.log("\nYear | Teams | Players | Events | Standings");
        yield* Effect.log("-----|-------|---------|--------|----------");
        for (const summary of summaries) {
          yield* Effect.log(
            `${summary.year} | ${String(summary.teams.count).padStart(5)} | ${String(summary.players.count).padStart(7)} | ${String(summary.events.count).padStart(6)} | ${String(summary.standings.count).padStart(9)}`,
          );
        }

        yield* Effect.log("\nAPI Response Times (ms):");
        yield* Effect.log("Year | Teams  | Players | Events");
        yield* Effect.log("-----|--------|---------|-------");
        for (const summary of summaries) {
          yield* Effect.log(
            `${summary.year} | ${String(summary.timing.teamsMs).padStart(6)} | ${String(summary.timing.playersMs).padStart(7)} | ${String(summary.timing.eventsMs).padStart(6)}`,
          );
        }

        yield* Effect.log("\n✅ Exploration complete!");
      }),
  );

  return yield* Command.run(command, { version: "1.0.0" });
});

BunRuntime.runMain(
  main.pipe(Effect.provide(Layer.mergeAll(PLLClient.layer, BunServices.layer))),
);
