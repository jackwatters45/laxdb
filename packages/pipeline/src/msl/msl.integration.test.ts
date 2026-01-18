import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { MSLClient } from "./msl.client";

// Integration tests hit real external APIs (Gamesheet)
// Longer timeouts needed for network latency
const TEAM_TIMEOUT = 15_000;
const PLAYER_TIMEOUT = 60_000; // Players require fetching paginated API data

// MSL Gamesheet season IDs
// 2025: 9567, 2024: 6007, 2023: 3246
const TEST_SEASON_ID = 6007; // 2024 season - stable data

describe("MSLClient", () => {
  describe("getTeams", () => {
    it(
      "fetches teams for season",
      async () => {
        const program = Effect.gen(function* () {
          const msl = yield* MSLClient;
          return yield* msl.getTeams({ seasonId: TEST_SEASON_ID });
        });

        const teams = await Effect.runPromise(
          program.pipe(Effect.provide(MSLClient.Default)),
        );

        expect(teams.length).toBeGreaterThan(0);
        expect(teams[0]).toHaveProperty("id");
        expect(teams[0]).toHaveProperty("name");
      },
      TEAM_TIMEOUT,
    );
  });

  describe("getPlayers", () => {
    it(
      "fetches players for season",
      async () => {
        const program = Effect.gen(function* () {
          const msl = yield* MSLClient;
          return yield* msl.getPlayers({ seasonId: TEST_SEASON_ID });
        });

        const players = await Effect.runPromise(
          program.pipe(Effect.provide(MSLClient.Default)),
        );

        expect(players.length).toBeGreaterThan(0);
        expect(players[0]).toHaveProperty("id");
        expect(players[0]).toHaveProperty("name");
        expect(players[0]).toHaveProperty("stats");
        expect(players[0]?.stats).toHaveProperty("goals");
        expect(players[0]?.stats).toHaveProperty("assists");
        expect(players[0]?.stats).toHaveProperty("points");
      },
      PLAYER_TIMEOUT,
    );
  });

  describe("getGoalies", () => {
    it(
      "fetches goalies for season",
      async () => {
        const program = Effect.gen(function* () {
          const msl = yield* MSLClient;
          return yield* msl.getGoalies({ seasonId: TEST_SEASON_ID });
        });

        const goalies = await Effect.runPromise(
          program.pipe(Effect.provide(MSLClient.Default)),
        );

        expect(goalies.length).toBeGreaterThan(0);
        expect(goalies[0]).toHaveProperty("id");
        expect(goalies[0]).toHaveProperty("name");
        expect(goalies[0]).toHaveProperty("stats");
        expect(goalies[0]?.stats).toHaveProperty("games_played");
        expect(goalies[0]?.stats).toHaveProperty("wins");
        expect(goalies[0]?.stats).toHaveProperty("save_pct");
      },
      PLAYER_TIMEOUT,
    );
  });

  describe("getStandings", () => {
    it(
      "fetches standings for season",
      async () => {
        const program = Effect.gen(function* () {
          const msl = yield* MSLClient;
          return yield* msl.getStandings({ seasonId: TEST_SEASON_ID });
        });

        const standings = await Effect.runPromise(
          program.pipe(Effect.provide(MSLClient.Default)),
        );

        expect(standings.length).toBeGreaterThan(0);
        expect(standings[0]).toHaveProperty("team_id");
        expect(standings[0]).toHaveProperty("wins");
        expect(standings[0]).toHaveProperty("losses");
        expect(standings[0]).toHaveProperty("points");
      },
      TEAM_TIMEOUT,
    );
  });

  describe("getSchedule", () => {
    it(
      "fetches schedule for season 9567",
      async () => {
        const program = Effect.gen(function* () {
          const msl = yield* MSLClient;
          return yield* msl.getSchedule({ seasonId: 9567 });
        });

        const games = await Effect.runPromise(
          program.pipe(Effect.provide(MSLClient.Default)),
        );

        expect(games.length).toBeGreaterThan(0);
        expect(games[0]).toHaveProperty("id");
        expect(games[0]).toHaveProperty("home_team_id");
        expect(games[0]).toHaveProperty("away_team_id");
        expect(games[0]).toHaveProperty("date");
      },
      TEAM_TIMEOUT,
    );
  });
});
