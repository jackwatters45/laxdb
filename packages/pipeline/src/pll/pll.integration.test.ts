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

  describe("getAdvancedPlayers", () => {
    it("fetches 2025 players with advanced stats", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getAdvancedPlayers({ year: 2025, limit: 5 });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(players.length).toBe(5);
      expect(players[0]).toHaveProperty("officialId");
      expect(players[0]).toHaveProperty("firstName");
      expect(players[0]).toHaveProperty("lastName");
    });

    it("returns players with currentTeam data", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getAdvancedPlayers({ year: 2025, limit: 10 });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const playerWithTeam = players.find((p) => p.currentTeam !== null);
      expect(playerWithTeam).toBeDefined();
      expect(playerWithTeam?.currentTeam).toHaveProperty("officialId");
      expect(playerWithTeam?.currentTeam).toHaveProperty("fullName");
      expect(playerWithTeam?.currentTeam).toHaveProperty("position");
    });

    it("returns players with stats and rate fields", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getAdvancedPlayers({ year: 2025, limit: 50 });
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
      expect(playerWithStats?.stats).toHaveProperty("shotRate");
      expect(playerWithStats?.stats).toHaveProperty("goalRate");
    });

    it("returns players with advancedSeasonStats", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getAdvancedPlayers({ year: 2025, limit: 100 });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const playerWithAdvanced = players.find(
        (p) => p.advancedSeasonStats !== null,
      );
      expect(playerWithAdvanced).toBeDefined();
      expect(playerWithAdvanced?.advancedSeasonStats).toHaveProperty(
        "unassistedGoals",
      );
      expect(playerWithAdvanced?.advancedSeasonStats).toHaveProperty(
        "assistedGoals",
      );
      expect(playerWithAdvanced?.advancedSeasonStats).toHaveProperty(
        "settledGoals",
      );
      expect(playerWithAdvanced?.advancedSeasonStats).toHaveProperty(
        "fastbreakGoals",
      );
    });

    it("returns players with handedness stats", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getAdvancedPlayers({ year: 2025, limit: 100 });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const playerWithAdvanced = players.find(
        (p) => p.advancedSeasonStats !== null,
      );
      expect(playerWithAdvanced?.advancedSeasonStats).toHaveProperty("lhShots");
      expect(playerWithAdvanced?.advancedSeasonStats).toHaveProperty("rhShots");
      expect(playerWithAdvanced?.advancedSeasonStats).toHaveProperty(
        "lhShotPct",
      );
      expect(playerWithAdvanced?.advancedSeasonStats).toHaveProperty(
        "rhShotPct",
      );
    });

    it("uses default limit of 250", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getAdvancedPlayers({ year: 2025 });
      });

      const players = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(players.length).toBeLessThanOrEqual(250);
      expect(players.length).toBeGreaterThan(0);
    });
  });

  describe("getTeams", () => {
    it("fetches 2024 teams", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getTeams({ year: 2024 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(teams.length).toBeGreaterThan(0);
      expect(teams[0]).toHaveProperty("officialId");
      expect(teams[0]).toHaveProperty("fullName");
      expect(teams[0]).toHaveProperty("teamWins");
    });

    it("fetches teams with champ series data", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getTeams({ year: 2024, includeChampSeries: true });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(teams.length).toBeGreaterThan(0);
      const teamWithChampSeries = teams.find((t) => t.champSeries);
      expect(teamWithChampSeries).toBeDefined();
      expect(teamWithChampSeries?.champSeries).toHaveProperty("teamWins");
    });

    it("returns teams with expected properties", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getTeams({ year: 2024 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(teams[0]).toBeDefined();
      expect(teams[0]?.officialId).toBeTypeOf("string");
      expect(teams[0]?.fullName).toBeTypeOf("string");
      expect(teams[0]?.teamWins).toBeTypeOf("number");
      expect(teams[0]?.teamLosses).toBeTypeOf("number");
      expect(teams[0]?.coaches).toBeInstanceOf(Array);
    });

    it("returns team stats with expected properties", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getTeams({ year: 2024 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const teamWithStats = teams.find((t) => t.stats);
      expect(teamWithStats?.stats).toBeDefined();
      expect(teamWithStats?.stats?.gamesPlayed).toBeTypeOf("number");
      expect(teamWithStats?.stats?.goals).toBeTypeOf("number");
      expect(teamWithStats?.stats?.faceoffPct).toBeTypeOf("number");
    });
  });

  describe("getCareerStats", () => {
    it("fetches career stats for faceoffsWon", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getCareerStats({ stat: "faceoffsWon", limit: 25 });
      });

      const stats = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(stats.length).toBe(25);
      expect(stats[0]).toHaveProperty("player");
      expect(stats[0]).toHaveProperty("faceoffsWon");
      expect(stats[0]?.player).toHaveProperty("name");
    });

    it("fetches career stats for goals", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getCareerStats({ stat: "goals", limit: 10 });
      });

      const stats = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(stats.length).toBe(10);
      expect(stats[0]).toHaveProperty("goals");
    });

    it("returns career stats with expected properties", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getCareerStats({ stat: "points", limit: 5 });
      });

      const stats = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(stats[0]).toBeDefined();
      expect(stats[0]?.player.name).toBeTypeOf("string");
      expect(stats[0]?.gamesPlayed).toBeTypeOf("number");
      expect(stats[0]?.points).toBeTypeOf("number");
      expect(stats[0]?.goals).toBeTypeOf("number");
      expect(stats[0]?.assists).toBeTypeOf("number");
      expect(stats[0]?.groundBalls).toBeTypeOf("number");
      expect(stats[0]?.saves).toBeTypeOf("number");
      expect(stats[0]?.faceoffsWon).toBeTypeOf("number");
    });

    it("returns player info with experience and years", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getCareerStats({ stat: "goals", limit: 10 });
      });

      const stats = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const playerWithExp = stats.find((s) => s.player.experience !== null);
      expect(playerWithExp).toBeDefined();
      expect(playerWithExp?.player.experience).toBeTypeOf("number");
    });
  });

  describe("getPlayerDetail", () => {
    it("fetches player detail by slug", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        const players = yield* pll.getPlayers({
          season: 2024,
          includeReg: true,
          limit: 1,
        });
        const playerSlug = players[0]?.slug;
        if (!playerSlug) return null;
        return yield* pll.getPlayerDetail({
          slug: playerSlug,
          statsYear: 2024,
        });
      });

      const player = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(player).toBeDefined();
      expect(player).toHaveProperty("officialId");
      expect(player).toHaveProperty("allSeasonStats");
      expect(player).toHaveProperty("accolades");
    });

    it("returns player with career stats", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        const players = yield* pll.getPlayers({
          season: 2024,
          includeReg: true,
          limit: 10,
        });
        const playerWithGames = players.find(
          (p) => p.stats && p.stats.gamesPlayed > 0 && p.slug,
        );
        if (!playerWithGames?.slug) return null;
        return yield* pll.getPlayerDetail({
          slug: playerWithGames.slug,
          statsYear: 2024,
        });
      });

      const player = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(player).toBeDefined();
      expect(player?.careerStats).toBeDefined();
      expect(player?.careerStats).toHaveProperty("gamesPlayed");
      expect(player?.careerStats).toHaveProperty("goals");
    });
  });

  describe("getTeamDetail", () => {
    it("fetches team detail by id", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        const teams = yield* pll.getTeams({ year: 2024 });
        const teamId = teams[0]?.officialId;
        if (!teamId) return null;
        return yield* pll.getTeamDetail({
          id: teamId,
          year: 2024,
          statsYear: 2024,
          eventsYear: 2024,
        });
      });

      const team = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(team).toBeDefined();
      expect(team).toHaveProperty("officialId");
      expect(team).toHaveProperty("events");
      expect(team).toHaveProperty("coaches");
    });

    it("returns team with events and coaches", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        const teams = yield* pll.getTeams({ year: 2024 });
        const teamId = teams[0]?.officialId;
        if (!teamId) return null;
        return yield* pll.getTeamDetail({
          id: teamId,
          year: 2024,
          statsYear: 2024,
          eventsYear: 2024,
        });
      });

      const team = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(team).toBeDefined();
      expect(team?.events.length).toBeGreaterThan(0);
      expect(team?.events[0]).toHaveProperty("id");
      expect(team?.events[0]).toHaveProperty("slugname");
      expect(team?.coaches.length).toBeGreaterThan(0);
      expect(team?.coaches[0]).toHaveProperty("firstName");
    });
  });

  describe("getTeamStats", () => {
    it("fetches team stats for regular season", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        const teams = yield* pll.getTeams({ year: 2024 });
        const teamId = teams[0]?.officialId;
        if (!teamId) return null;
        return yield* pll.getTeamStats({
          id: teamId,
          year: 2024,
          segment: "regular",
        });
      });

      const stats = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("gamesPlayed");
      expect(stats).toHaveProperty("goals");
      expect(stats).toHaveProperty("shots");
    });

    it("fetches team stats for post season", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        const teams = yield* pll.getTeams({ year: 2024 });
        const teamId = teams[0]?.officialId;
        if (!teamId) return null;
        return yield* pll.getTeamStats({
          id: teamId,
          year: 2024,
          segment: "post",
        });
      });

      const stats = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(stats).toBeDefined();
    });
  });

  describe("getEvents", () => {
    it("fetches 2026 events with CS and WLL", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getEvents({
          year: 2026,
          includeCS: true,
          includeWLL: true,
        });
      });

      const events = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty("id");
      expect(events[0]).toHaveProperty("year");
      expect(events[0]).toHaveProperty("venue");
    });

    it("fetches 2025 events", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getEvents({ year: 2025 });
      });

      const events = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(events.length).toBeGreaterThan(0);
    });

    it("returns events with expected properties", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getEvents({ year: 2026 });
      });

      const events = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(events[0]).toBeDefined();
      expect(events[0]?.id).toBeTypeOf("number");
      expect(events[0]?.year).toBeTypeOf("number");
    });

    it("returns events with team data", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getEvents({ year: 2026 });
      });

      const events = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const eventWithTeams = events.find((e) => e.homeTeam && e.awayTeam);
      expect(eventWithTeams).toBeDefined();
      expect(eventWithTeams?.homeTeam).toHaveProperty("officialId");
      expect(eventWithTeams?.homeTeam).toHaveProperty("fullName");
      expect(eventWithTeams?.awayTeam).toHaveProperty("officialId");
      expect(eventWithTeams?.awayTeam).toHaveProperty("fullName");
    });
  });

  describe("getEventDetail", () => {
    it("fetches event detail with play-by-play", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getEventDetail({ slug: "2024_game_1" });
      });

      const event = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(event).toBeDefined();
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("homeTeam");
      expect(event).toHaveProperty("awayTeam");
      expect(event).toHaveProperty("homeScore");
      expect(event).toHaveProperty("visitorScore");
      expect(event).toHaveProperty("playLogs");
    });

    it("returns event with team info", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getEventDetail({ slug: "2024_game_1" });
      });

      const event = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(event?.homeTeam).toBeDefined();
      expect(event?.homeTeam?.officialId).toBeTypeOf("string");
      expect(event?.homeTeam?.fullName).toBeTypeOf("string");
      expect(event?.homeTeam?.locationCode).toBeTypeOf("string");
      expect(event?.awayTeam?.officialId).toBeTypeOf("string");
      expect(event?.awayTeam?.fullName).toBeTypeOf("string");
    });

    it("returns event with play logs", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getEventDetail({ slug: "2024_game_1" });
      });

      const event = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(event?.playLogs).toBeDefined();
      expect(event?.playLogs?.length).toBeGreaterThan(0);

      const playLog = event?.playLogs?.[0];
      expect(playLog).toHaveProperty("id");
      expect(playLog).toHaveProperty("period");
      expect(playLog).toHaveProperty("minutes");
      expect(playLog).toHaveProperty("seconds");
      expect(playLog).toHaveProperty("teamId");
      expect(playLog).toHaveProperty("description");
    });

    it("returns play logs with expected types", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        return yield* pll.getEventDetail({ slug: "2024_game_1" });
      });

      const event = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      const playLog = event?.playLogs?.[0];
      expect(playLog?.id).toBeTypeOf("number");
      expect(playLog?.period).toBeTypeOf("number");
      expect(playLog?.minutes).toBeTypeOf("number");
      expect(playLog?.seconds).toBeTypeOf("number");
      expect(playLog?.teamId).toBeTypeOf("string");
      expect(playLog?.description).toBeTypeOf("string");
    });

    it("fetches event using slug from getEvents", async () => {
      const program = Effect.gen(function* () {
        const pll = yield* PLLClient;
        const events = yield* pll.getEvents({ year: 2024 });
        const completedEvent = events.find(
          (e) => e.eventStatus === 3 && e.slugname,
        );
        if (!completedEvent?.slugname) return null;
        return yield* pll.getEventDetail({ slug: completedEvent.slugname });
      });

      const event = await Effect.runPromise(
        program.pipe(Effect.provide(PLLClient.Default)),
      );

      expect(event).toBeDefined();
      expect(event?.homeScore).toBeTypeOf("number");
      expect(event?.visitorScore).toBeTypeOf("number");
      expect(event?.eventStatus).toBe(3); // Completed
    });
  });
});
