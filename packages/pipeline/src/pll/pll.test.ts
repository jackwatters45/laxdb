import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { PLLClient } from "./pll.client";

describe("PLLClient", () => {
  describe("getStandings (REST)", () => {
    it("fetches 2024 standings", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getStandings({ year: 2024, champSeries: false });
      });

      const standings = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(standings.length).toBe(8);
      expect(standings[0]).toHaveProperty("teamId");
      expect(standings[0]).toHaveProperty("fullName");
      expect(standings[0]).toHaveProperty("wins");
      expect(standings[0]).toHaveProperty("losses");
    });

    it("fetches 2023 standings", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getStandings({ year: 2023, champSeries: false });
      });

      const standings = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(standings.length).toBeGreaterThan(0);
    });

    it("returns teams with expected properties", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getStandings({ year: 2024, champSeries: false });
      });

      const standings = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(standings[0]).toBeDefined();
      expect(standings[0]?.teamId).toBeTypeOf("string");
      expect(standings[0]?.fullName).toBeTypeOf("string");
      expect(standings[0]?.wins).toBeTypeOf("number");
      expect(standings[0]?.losses).toBeTypeOf("number");
      expect(standings[0]?.ties).toBeTypeOf("number");
      expect(standings[0]?.scores).toBeTypeOf("number");
      expect(standings[0]?.scoresAgainst).toBeTypeOf("number");
      expect(standings[0]?.scoreDiff).toBeTypeOf("number");
    });
  });

  describe("getStandingsGraphQL", () => {
    it("fetches 2025 standings via GraphQL", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getStandingsGraphQL({
          year: 2025,
          champSeries: false,
        });
      });

      const standings = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(standings.length).toBeGreaterThan(0);
      expect(standings[0]).toHaveProperty("team");
      expect(standings[0]?.team).toHaveProperty("officialId");
      expect(standings[0]?.team).toHaveProperty("fullName");
    });

    it("returns standings with nested team data", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getStandingsGraphQL({
          year: 2024,
          champSeries: false,
        });
      });

      const standings = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(standings[0]).toBeDefined();
      expect(standings[0]?.team.officialId).toBeTypeOf("string");
      expect(standings[0]?.team.fullName).toBeTypeOf("string");
      expect(standings[0]?.conferenceWins).toBeTypeOf("number");
      expect(standings[0]?.conferenceLosses).toBeTypeOf("number");
    });
  });

  describe("getPlayers", () => {
    it("fetches 2025 players", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getPlayers({
          season: 2025,
          league: "PLL",
          includeReg: true,
          includePost: false,
          includeZPP: false,
          limit: 5,
        });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(players.length).toBe(5);
      expect(players[0]).toHaveProperty("officialId");
      expect(players[0]).toHaveProperty("firstName");
      expect(players[0]).toHaveProperty("lastName");
    });

    it("fetches players with regular season stats", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getPlayers({
          season: 2024,
          league: "PLL",
          includeReg: true,
          includePost: false,
          includeZPP: false,
          limit: 10,
        });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const playerWithStats = players.find(
        (p) => p.stats && p.stats.gamesPlayed > 0,
      );
      expect(playerWithStats).toBeDefined();
      expect(playerWithStats?.stats).toHaveProperty("goals");
      expect(playerWithStats?.stats).toHaveProperty("assists");
    });

    it("fetches players with post-season stats", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getPlayers({
          season: 2024,
          league: "PLL",
          includeReg: false,
          includePost: true,
          includeZPP: false,
          limit: 50,
        });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const playerWithPostStats = players.find(
        (p) => p.postStats && p.postStats.gamesPlayed > 0,
      );
      expect(playerWithPostStats).toBeDefined();
      expect(playerWithPostStats?.postStats).toHaveProperty("goals");
    });

    it("fetches players without limit returns many", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getPlayers({
          season: 2024,
          league: "PLL",
          includeReg: true,
          includePost: false,
          includeZPP: false,
        });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(players.length).toBeGreaterThan(50);
    });

    it("returns players with expected properties", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getPlayers({
          season: 2025,
          league: "PLL",
          includeReg: true,
          includePost: false,
          includeZPP: false,
          limit: 1,
        });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(players[0]).toBeDefined();
      expect(players[0]?.officialId).toBeTypeOf("string");
      expect(players[0]?.firstName).toBeTypeOf("string");
      expect(players[0]?.lastName).toBeTypeOf("string");
      expect(players[0]?.allTeams).toBeInstanceOf(Array);
      expect(players[0]?.allTeams.length).toBeGreaterThan(0);
    });

    it("returns player teams with expected properties", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getPlayers({
          season: 2025,
          league: "PLL",
          includeReg: true,
          includePost: false,
          includeZPP: false,
          limit: 1,
        });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(players[0]?.allTeams[0]).toBeDefined();
      expect(players[0]?.allTeams[0]?.officialId).toBeTypeOf("string");
      expect(players[0]?.allTeams[0]?.fullName).toBeTypeOf("string");
      expect(players[0]?.allTeams[0]?.year).toBeTypeOf("number");
    });

    it("returns player stats with all fields", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getPlayers({
          season: 2024,
          league: "PLL",
          includeReg: true,
          includePost: false,
          includeZPP: false,
          limit: 50,
        });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const playerWithStats = players.find(
        (p) => p.stats && p.stats.gamesPlayed > 0,
      );
      expect(playerWithStats?.stats).toBeDefined();
      expect(playerWithStats?.stats?.gamesPlayed).toBeTypeOf("number");
      expect(playerWithStats?.stats?.goals).toBeTypeOf("number");
      expect(playerWithStats?.stats?.assists).toBeTypeOf("number");
      expect(playerWithStats?.stats?.points).toBeTypeOf("number");
      expect(playerWithStats?.stats?.groundBalls).toBeTypeOf("number");
      expect(playerWithStats?.stats?.turnovers).toBeTypeOf("number");
    });
  });

  describe("getStatLeaders", () => {
    it("fetches regular season stat leaders", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getStatLeaders({
          year: 2024,
          seasonSegment: "regular",
          limit: 10,
        });
      });

      const leaders = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(leaders.length).toBeGreaterThan(0);
      expect(leaders[0]).toHaveProperty("officialId");
      expect(leaders[0]).toHaveProperty("firstName");
      expect(leaders[0]).toHaveProperty("lastName");
      expect(leaders[0]).toHaveProperty("statType");
      expect(leaders[0]).toHaveProperty("statValue");
    });

    it("fetches post-season stat leaders", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getStatLeaders({
          year: 2024,
          seasonSegment: "post",
          limit: 10,
        });
      });

      const leaders = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(leaders.length).toBeGreaterThan(0);
    });

    it("returns stat leaders with expected properties", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getStatLeaders({
          year: 2024,
          seasonSegment: "regular",
          limit: 5,
        });
      });

      const leaders = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(leaders[0]).toBeDefined();
      expect(leaders[0]?.officialId).toBeTypeOf("string");
      expect(leaders[0]?.firstName).toBeTypeOf("string");
      expect(leaders[0]?.lastName).toBeTypeOf("string");
      expect(leaders[0]?.statType).toBeTypeOf("string");
      expect(leaders[0]?.statValue).toBeTypeOf("number");
      expect(leaders[0]?.playerRank).toBeTypeOf("number");
      expect(leaders[0]?.teamId).toBeTypeOf("string");
      expect(leaders[0]?.year).toBeTypeOf("number");
    });

    it("fetches 2025 post-season leaders", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getStatLeaders({
          year: 2025,
          seasonSegment: "post",
          limit: 5,
        });
      });

      const leaders = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(leaders).toBeInstanceOf(Array);
    });
  });
});
