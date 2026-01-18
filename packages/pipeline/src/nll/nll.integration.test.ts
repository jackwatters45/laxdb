import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { NLLClient } from "./nll.client";

describe("NLLClient", () => {
  describe("getTeams", () => {
    it("fetches teams for season 225", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getTeams({ seasonId: 225 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(teams.length).toBeGreaterThan(0);
      expect(teams[0]).toHaveProperty("id");
      expect(teams[0]).toHaveProperty("code");
      expect(teams[0]).toHaveProperty("name");
    });

    it("returns teams with expected properties", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getTeams({ seasonId: 225 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(teams[0]).toBeDefined();
      expect(teams[0]?.id).toBeTypeOf("string");
      expect(teams[0]?.code).toBeTypeOf("string");
    });
  });

  describe("getPlayers", () => {
    it("fetches players for season 225", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getPlayers({ seasonId: 225 });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(players.length).toBeGreaterThan(0);
      expect(players[0]).toHaveProperty("personId");
      expect(players[0]).toHaveProperty("firstname");
      expect(players[0]).toHaveProperty("team_id");
    }, 30000);

    it("returns players with expected properties", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getPlayers({ seasonId: 225 });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(players[0]).toBeDefined();
      expect(players[0]?.personId).toBeTypeOf("string");
      expect(players[0]?.firstname).toBeTypeOf("string");
    }, 30000);
  });

  describe("getStandings", () => {
    it("fetches standings for season 225", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getStandings({ seasonId: 225 });
      });

      const standings = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(standings.length).toBeGreaterThan(0);
      expect(standings[0]).toHaveProperty("team_id");
      expect(standings[0]).toHaveProperty("wins");
      expect(standings[0]).toHaveProperty("losses");
    });

    it("returns standings with expected properties", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getStandings({ seasonId: 225 });
      });

      const standings = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(standings[0]).toBeDefined();
      expect(standings[0]?.team_id).toBeTypeOf("string");
      expect(standings[0]?.wins).toBeTypeOf("number");
      expect(standings[0]?.losses).toBeTypeOf("number");
    });
  });

  describe("getSchedule", () => {
    it("fetches schedule for season 225", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getSchedule({ seasonId: 225 });
      });

      const schedule = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule[0]).toHaveProperty("id");
      expect(schedule[0]).toHaveProperty("squads");
      expect(schedule[0]).toHaveProperty("date");
      expect(schedule[0]).toHaveProperty("status");
    });

    it("returns schedule with expected properties", async () => {
      const program = Effect.gen(function* () {
        const nll = yield* NLLClient;
        return yield* nll.getSchedule({ seasonId: 225 });
      });

      const schedule = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(schedule[0]).toBeDefined();
      expect(schedule[0]?.id).toBeTypeOf("string");
      expect(schedule[0]?.squads).toHaveProperty("away");
      expect(schedule[0]?.squads).toHaveProperty("home");
    });
  });
});
