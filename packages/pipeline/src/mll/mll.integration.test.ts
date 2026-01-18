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
});
