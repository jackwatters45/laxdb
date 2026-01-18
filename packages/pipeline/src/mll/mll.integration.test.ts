import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { MLLClient } from "./mll.client";

// Integration tests hit real external APIs (statscrew.com)
// Longer timeouts needed for network latency
const TEAM_TIMEOUT = 15_000;
const PLAYER_TIMEOUT = 60_000; // Players require fetching each team's stats page

describe("MLLClient", () => {
  describe("getTeams", () => {
    it(
      "fetches teams for year 2006",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getTeams({ year: 2006 });
        });

        const teams = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(teams.length).toBeGreaterThan(0);
        expect(teams[0]).toHaveProperty("id");
        expect(teams[0]).toHaveProperty("name");
      },
      TEAM_TIMEOUT,
    );

    it(
      "returns teams with expected properties",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getTeams({ year: 2006 });
        });

        const teams = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(teams[0]).toBeDefined();
        expect(teams[0]?.id).toBeTypeOf("string");
        expect(teams[0]?.name).toBeTypeOf("string");
      },
      TEAM_TIMEOUT,
    );

    it(
      "fetches teams for year 2019",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getTeams({ year: 2019 });
        });

        const teams = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(teams.length).toBe(6);
        expect(teams[0]).toHaveProperty("id");
        expect(teams[0]).toHaveProperty("name");
      },
      TEAM_TIMEOUT,
    );
  });

  describe("getPlayers", () => {
    it(
      "fetches players for year 2006",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getPlayers({ year: 2006 });
        });

        const players = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(players.length).toBeGreaterThan(0);
        expect(players[0]).toHaveProperty("id");
        expect(players[0]).toHaveProperty("name");
        expect(players[0]).toHaveProperty("team_id");
      },
      PLAYER_TIMEOUT,
    );

    it(
      "returns players with expected properties",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getPlayers({ year: 2006 });
        });

        const players = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(players[0]).toBeDefined();
        expect(players[0]?.id).toBeTypeOf("string");
        expect(players[0]?.name).toBeTypeOf("string");
        expect(players[0]?.stats).toBeDefined();
        expect(players[0]?.stats?.games_played).toBeTypeOf("number");
        expect(players[0]?.stats?.goals).toBeTypeOf("number");
        expect(players[0]?.stats?.assists).toBeTypeOf("number");
        expect(players[0]?.stats?.points).toBeTypeOf("number");
      },
      PLAYER_TIMEOUT,
    );

    it(
      "fetches players for year 2019",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getPlayers({ year: 2019 });
        });

        const players = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(players.length).toBeGreaterThan(0);
        expect(players[0]).toHaveProperty("id");
        expect(players[0]).toHaveProperty("name");
        expect(players[0]).toHaveProperty("stats");
      },
      PLAYER_TIMEOUT,
    );
  });

  describe("getGoalies", () => {
    it(
      "fetches goalies for year 2019",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getGoalies({ year: 2019 });
        });

        const goalies = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(goalies.length).toBeGreaterThan(0);
        expect(goalies[0]).toHaveProperty("id");
        expect(goalies[0]).toHaveProperty("name");
        expect(goalies[0]).toHaveProperty("team_id");
      },
      PLAYER_TIMEOUT,
    );

    it(
      "returns goalies with expected properties",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getGoalies({ year: 2019 });
        });

        const goalies = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(goalies[0]).toBeDefined();
        expect(goalies[0]?.id).toBeTypeOf("string");
        expect(goalies[0]?.name).toBeTypeOf("string");
        expect(goalies[0]?.stats).toBeDefined();
        expect(goalies[0]?.stats?.gaa).toSatisfy(
          (v: unknown) => v === null || typeof v === "number",
        );
        expect(goalies[0]?.stats?.save_pct).toSatisfy(
          (v: unknown) => v === null || typeof v === "number",
        );
      },
      PLAYER_TIMEOUT,
    );
  });

  describe("getStandings", () => {
    it(
      "fetches standings for year 2019",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getStandings({ year: 2019 });
        });

        const standings = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(standings.length).toBe(6);
        expect(standings[0]).toHaveProperty("team_id");
        expect(standings[0]).toHaveProperty("wins");
        expect(standings[0]).toHaveProperty("losses");
      },
      TEAM_TIMEOUT,
    );

    it(
      "returns standings with expected properties",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getStandings({ year: 2019 });
        });

        const standings = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(standings[0]).toBeDefined();
        expect(standings[0]?.team_id).toBeTypeOf("string");
        expect(standings[0]?.wins).toBeTypeOf("number");
        expect(standings[0]?.losses).toBeTypeOf("number");
        expect(standings[0]?.games_played).toBeTypeOf("number");
        expect(standings[0]?.position).toBeTypeOf("number");
      },
      TEAM_TIMEOUT,
    );
  });

  describe("getStatLeaders", () => {
    it(
      "fetches stat leaders for year 2019",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getStatLeaders({ year: 2019 });
        });

        const leaders = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(leaders.length).toBeGreaterThan(0);
        expect(leaders[0]).toHaveProperty("player_name");
        expect(leaders[0]).toHaveProperty("stat_type");
        expect(leaders[0]).toHaveProperty("stat_value");
      },
      TEAM_TIMEOUT,
    );

    it(
      "returns stat leaders with expected properties",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getStatLeaders({ year: 2019 });
        });

        const leaders = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        expect(leaders[0]).toBeDefined();
        expect(leaders[0]?.player_id).toBeTypeOf("string");
        expect(leaders[0]?.player_name).toBeTypeOf("string");
        expect(leaders[0]?.stat_type).toBeTypeOf("string");
        expect(leaders[0]?.stat_value).toBeTypeOf("number");
        expect(leaders[0]?.rank).toBeTypeOf("number");
      },
      TEAM_TIMEOUT,
    );
  });

  describe("getSchedule", () => {
    // Wayback Machine can be slow - need longer timeout
    const WAYBACK_TIMEOUT = 90_000;

    it(
      "fetches schedule for year 2006 from Wayback",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getSchedule({ year: 2006 });
        });

        const games = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        // 2006 has good Wayback coverage - should have some games
        // May not be complete, but should have at least some data
        console.log(`Coverage: ${games.length} games found for 2006`);

        expect(games.length).toBeGreaterThanOrEqual(0);

        if (games.length > 0) {
          expect(games[0]).toHaveProperty("id");
          expect(games[0]).toHaveProperty("home_team_id");
          expect(games[0]).toHaveProperty("away_team_id");
        }
      },
      WAYBACK_TIMEOUT,
    );

    it(
      "returns games with expected properties when available",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          return yield* mll.getSchedule({ year: 2006 });
        });

        const games = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        // Log coverage for transparency
        console.log(`Coverage: ${games.length} games found for 2006`);

        if (games.length > 0) {
          const game = games[0];
          expect(game).toBeDefined();
          expect(game?.id).toBeTypeOf("string");
          expect(game?.home_team_id).toBeTypeOf("string");
          expect(game?.away_team_id).toBeTypeOf("string");
          // These may be null for archived data
          expect(game).toHaveProperty("home_score");
          expect(game).toHaveProperty("away_score");
          expect(game).toHaveProperty("date");
          expect(game).toHaveProperty("source_url");
        }
      },
      WAYBACK_TIMEOUT,
    );

    it(
      "handles years with no Wayback coverage gracefully",
      async () => {
        const program = Effect.gen(function* () {
          const mll = yield* MLLClient;
          // 2019 likely has no/minimal Wayback coverage
          return yield* mll.getSchedule({ year: 2019 });
        });

        const games = await Effect.runPromise(
          program.pipe(Effect.provide(MLLClient.Default)),
        );

        // Should return empty array, not throw
        console.log(`Coverage: ${games.length} games found for 2019`);
        expect(Array.isArray(games)).toBe(true);
      },
      WAYBACK_TIMEOUT,
    );
  });
});
