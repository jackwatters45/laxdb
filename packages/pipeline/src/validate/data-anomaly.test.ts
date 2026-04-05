import { BunServices } from "@effect/platform-bun";
import { Effect, Schema } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { beforeAll, describe, expect, it } from "vitest";

const PlayerDetailSchema = Schema.Struct({
  slug: Schema.String,
  officialId: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  careerStats: Schema.NullOr(
    Schema.Struct({
      gamesPlayed: Schema.Number,
      goals: Schema.Number,
      assists: Schema.Number,
      points: Schema.Number,
      shots: Schema.Number,
      shotPct: Schema.Number,
      saves: Schema.Number,
      savePct: Schema.Number,
      faceoffsWon: Schema.Number,
      faceoffs: Schema.Number,
      faceoffPct: Schema.Number,
    }),
  ),
  allSeasonStats: Schema.Array(
    Schema.Struct({
      year: Schema.Number,
      seasonSegment: Schema.String,
      gamesPlayed: Schema.Number,
      goals: Schema.Number,
      assists: Schema.Number,
      points: Schema.Number,
      shots: Schema.Number,
    }),
  ),
});
type PlayerDetail = typeof PlayerDetailSchema.Type;

const CareerStatsPlayerSchema = Schema.Struct({
  slug: Schema.NullOr(Schema.String),
  name: Schema.String,
  experience: Schema.NullOr(Schema.Number),
  allYears: Schema.NullOr(Schema.Array(Schema.Number)),
  stats: Schema.Struct({
    gamesPlayed: Schema.Number,
    points: Schema.Number,
    goals: Schema.Number,
    assists: Schema.Number,
    groundBalls: Schema.Number,
    saves: Schema.Number,
    faceoffsWon: Schema.Number,
  }),
  inPlayerDetails: Schema.Boolean,
  likelySource: Schema.Literals(["pll", "mll_or_retired"]),
});
type CareerStatsPlayer = typeof CareerStatsPlayerSchema.Type;

const YearPlayerSchema = Schema.Struct({
  officialId: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  slug: Schema.NullOr(Schema.String),
  allTeams: Schema.Array(
    Schema.Struct({
      officialId: Schema.String,
      year: Schema.Number,
      position: Schema.NullOr(Schema.String),
    }),
  ),
  stats: Schema.optional(
    Schema.Struct({
      gamesPlayed: Schema.Number,
      goals: Schema.Number,
      assists: Schema.Number,
      points: Schema.Number,
      shots: Schema.Number,
    }),
  ),
});
type YearPlayer = typeof YearPlayerSchema.Type;

const YearTeamSchema = Schema.Struct({
  officialId: Schema.String,
  fullName: Schema.String,
  teamWins: Schema.Number,
  teamLosses: Schema.Number,
  stats: Schema.NullOr(
    Schema.Struct({
      gamesPlayed: Schema.Number,
      goals: Schema.Number,
      shots: Schema.Number,
    }),
  ),
});
type YearTeam = typeof YearTeamSchema.Type;

const YEARS = ["2019", "2020", "2021", "2022", "2023", "2024", "2025"];
const VALID_TEAM_IDS = new Set([
  "ARC",
  "ATL",
  "CAN",
  "CHA",
  "CHR",
  "OUT",
  "RED",
  "WAT",
  "WHP",
]);
const VALID_POSITIONS = new Set([
  "A",
  "M",
  "D",
  "G",
  "FO",
  "LSM",
  "SSDM",
  null,
]);

const parseJsonArray = <A>(
  content: string,
  decodeItem: (value: unknown) => A,
): A[] => {
  try {
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const decoded: A[] = [];
    for (const item of parsed) {
      decoded.push(decodeItem(item));
    }
    return decoded;
  } catch {
    return [];
  }
};

let playerDetails: PlayerDetail[] = [];
let careerStats: CareerStatsPlayer[] = [];
let yearPlayers: Record<string, YearPlayer[]> = {};
let yearTeams: Record<string, YearTeam[]> = {};
let hasLoadedData = false;

const loadTestData = Effect.gen(function* () {
  const fs = yield* FileSystem;
  const pathService = yield* Path;
  const outputDir = pathService.join(process.cwd(), "output", "pll");

  playerDetails = yield* fs
    .readFileString(pathService.join(outputDir, "player-details.json"))
    .pipe(
      Effect.map((content) =>
        parseJsonArray(content, Schema.decodeUnknownSync(PlayerDetailSchema)),
      ),
      Effect.catch(() => Effect.succeed([] as PlayerDetail[])),
    );

  careerStats = yield* fs
    .readFileString(pathService.join(outputDir, "career-stats.json"))
    .pipe(
      Effect.map((content) =>
        parseJsonArray(
          content,
          Schema.decodeUnknownSync(CareerStatsPlayerSchema),
        ),
      ),
      Effect.catch(() => Effect.succeed([] as CareerStatsPlayer[])),
    );

  const loadedYearPlayers: Record<string, YearPlayer[]> = {};
  const loadedYearTeams: Record<string, YearTeam[]> = {};

  for (const year of YEARS) {
    loadedYearPlayers[year] = yield* fs
      .readFileString(pathService.join(outputDir, year, "players.json"))
      .pipe(
        Effect.map((content) =>
          parseJsonArray(content, Schema.decodeUnknownSync(YearPlayerSchema)),
        ),
        Effect.catch(() => Effect.succeed([] as YearPlayer[])),
      );

    loadedYearTeams[year] = yield* fs
      .readFileString(pathService.join(outputDir, year, "teams.json"))
      .pipe(
        Effect.map((content) =>
          parseJsonArray(content, Schema.decodeUnknownSync(YearTeamSchema)),
        ),
        Effect.catch(() => Effect.succeed([] as YearTeam[])),
      );
  }

  yearPlayers = loadedYearPlayers;
  yearTeams = loadedYearTeams;
  hasLoadedData =
    playerDetails.length > 0 ||
    careerStats.length > 0 ||
    Object.values(yearPlayers).some((players) => players.length > 0) ||
    Object.values(yearTeams).some((teams) => teams.length > 0);
});

beforeAll(async () => {
  await Effect.runPromise(loadTestData.pipe(Effect.provide(BunServices.layer)));
});

const requireLoadedData = (): boolean => {
  if (!hasLoadedData) {
    console.warn(
      "Skipping PLL anomaly assertions because local output/pll data is missing.",
    );
    return false;
  }
  return true;
};

describe("Data Anomaly Detection", () => {
  describe("Player Details - Stat Consistency", () => {
    it("points should equal goals + assists for all players", () => {
      const violations: string[] = [];

      for (const player of playerDetails) {
        if (!player.careerStats) continue;
        const { goals, assists, points } = player.careerStats;
        if (points !== goals + assists) {
          violations.push(
            `${player.firstName} ${player.lastName}: points(${points}) != goals(${goals}) + assists(${assists})`,
          );
        }
      }

      expect(violations).toHaveLength(0);
    });

    it("shot percentage should be calculable from goals and shots", () => {
      const violations: string[] = [];

      for (const player of playerDetails) {
        if (!player.careerStats) continue;
        const { goals, shots, shotPct } = player.careerStats;
        if (shots === 0) continue;

        const calculatedPct = (goals / shots) * 100;
        const diff = Math.abs(calculatedPct - shotPct);

        if (diff > 1) {
          violations.push(
            `${player.firstName} ${player.lastName}: shotPct(${shotPct}) differs from calculated(${calculatedPct.toFixed(1)}) by ${diff.toFixed(1)}%`,
          );
        }
      }

      if (violations.length > 0) {
        console.warn(`Shot percentage anomalies found: ${violations.length}`);
      }
      expect(violations.length).toBeLessThan(10);
    });

    it("goals should never exceed shots", () => {
      const violations: string[] = [];

      for (const player of playerDetails) {
        if (!player.careerStats) continue;
        const { goals, shots } = player.careerStats;

        if (goals > shots) {
          violations.push(
            `${player.firstName} ${player.lastName}: goals(${goals}) > shots(${shots})`,
          );
        }
      }

      expect(violations).toHaveLength(0);
    });

    it("save percentage should be between 0 and 100", () => {
      const violations: string[] = [];

      for (const player of playerDetails) {
        if (!player.careerStats) continue;
        const { savePct, saves } = player.careerStats;
        if (saves === 0) continue;

        if (savePct < 0 || savePct > 100) {
          violations.push(
            `${player.firstName} ${player.lastName}: savePct(${savePct}) out of range`,
          );
        }
      }

      expect(violations).toHaveLength(0);
    });

    it("faceoff percentage should be calculable from wins and total", () => {
      const violations: string[] = [];

      for (const player of playerDetails) {
        if (!player.careerStats) continue;
        const { faceoffsWon, faceoffs, faceoffPct } = player.careerStats;
        if (faceoffs === 0) continue;

        const calculatedPct = (faceoffsWon / faceoffs) * 100;
        const diff = Math.abs(calculatedPct - faceoffPct);

        if (diff > 1) {
          violations.push(
            `${player.firstName} ${player.lastName}: faceoffPct(${faceoffPct}) differs from calculated(${calculatedPct.toFixed(1)})`,
          );
        }
      }

      if (violations.length > 0) {
        console.warn(`Faceoff percentage anomalies: ${violations.length}`);
      }
      expect(violations.length).toBeLessThan(5);
    });
  });

  describe("Career Stats - MLL/PLL Classification", () => {
    it("PLL players with pre-2019 years should also have 2019+ years (bridge players)", () => {
      const violations: string[] = [];

      for (const player of careerStats) {
        if (player.likelySource !== "pll") continue;
        if (!player.allYears) continue;

        const hasPrePLLYear = player.allYears.some((y) => y < 2019);
        const hasPLLYear = player.allYears.some((y) => y >= 2019);

        if (hasPrePLLYear && !hasPLLYear) {
          violations.push(
            `${player.name}: marked as PLL but no years >= 2019: ${player.allYears.join(", ")}`,
          );
        }
      }

      expect(violations).toHaveLength(0);
    });

    it("bridge players (MLL to PLL) should be identified", () => {
      if (!requireLoadedData()) return;

      const bridgePlayers = careerStats.filter((player) => {
        if (player.likelySource !== "pll" || !player.allYears) return false;
        const hasPrePLL = player.allYears.some((year) => year < 2019);
        const hasPLL = player.allYears.some((year) => year >= 2019);
        return hasPrePLL && hasPLL;
      });

      expect(bridgePlayers.length).toBeGreaterThan(100);
      console.log(`Found ${bridgePlayers.length} bridge players (MLL → PLL)`);
    });

    it("MLL players should have years < 2019 (mostly)", () => {
      if (!requireLoadedData()) return;

      const mllPlayers = careerStats.filter(
        (player) => player.likelySource === "mll_or_retired",
      );
      const mllWithOnlyPostPLL = mllPlayers.filter((player) => {
        if (!player.allYears) return false;
        return player.allYears.every((year) => year >= 2019);
      });

      expect(mllWithOnlyPostPLL.length).toBeLessThan(mllPlayers.length * 0.1);
    });

    it("inPlayerDetails flag should be accurate", () => {
      const playerDetailSlugs = new Set(
        playerDetails.map((player) => player.slug),
      );
      const violations: string[] = [];

      for (const player of careerStats) {
        if (!player.slug) continue;

        const inDetails = playerDetailSlugs.has(player.slug);
        if (inDetails !== player.inPlayerDetails) {
          violations.push(
            `${player.name}: inPlayerDetails(${player.inPlayerDetails}) but ${inDetails ? "found" : "not found"} in player-details.json`,
          );
        }
      }

      expect(violations).toHaveLength(0);
    });
  });

  describe("Year Players - Team References", () => {
    it("all player team references should be valid team IDs", () => {
      const violations: string[] = [];

      for (const year of YEARS) {
        const players = yearPlayers[year] ?? [];

        for (const player of players) {
          for (const team of player.allTeams) {
            if (!VALID_TEAM_IDS.has(team.officialId)) {
              violations.push(
                `${year} ${player.firstName} ${player.lastName}: invalid team ID "${team.officialId}"`,
              );
            }
          }
        }
      }

      expect(violations).toHaveLength(0);
    });

    it("all positions should be valid position codes", () => {
      const violations: string[] = [];

      for (const year of YEARS) {
        const players = yearPlayers[year] ?? [];

        for (const player of players) {
          for (const team of player.allTeams) {
            if (!VALID_POSITIONS.has(team.position)) {
              violations.push(
                `${year} ${player.firstName} ${player.lastName}: invalid position "${team.position}"`,
              );
            }
          }
        }
      }

      expect(violations).toHaveLength(0);
    });

    it("player officialId should be consistent across years", () => {
      const playerIdsBySlug = new Map<string, Set<string>>();

      for (const year of YEARS) {
        const players = yearPlayers[year] ?? [];

        for (const player of players) {
          if (!player.slug) continue;

          if (!playerIdsBySlug.has(player.slug)) {
            playerIdsBySlug.set(player.slug, new Set());
          }
          playerIdsBySlug.get(player.slug)?.add(player.officialId);
        }
      }

      const violations: string[] = [];
      for (const [slug, ids] of playerIdsBySlug) {
        if (ids.size > 1) {
          violations.push(
            `${slug}: multiple officialIds: ${[...ids].join(", ")}`,
          );
        }
      }

      expect(violations).toHaveLength(0);
    });
  });

  describe("Year Teams - Record Consistency", () => {
    it("team wins + losses should equal games played (approximately)", () => {
      const violations: string[] = [];

      for (const year of YEARS) {
        const teams = yearTeams[year] ?? [];

        for (const team of teams) {
          if (!team.stats) continue;
          const { gamesPlayed } = team.stats;
          const totalGames = team.teamWins + team.teamLosses;

          if (gamesPlayed !== totalGames) {
            violations.push(
              `${year} ${team.fullName}: gamesPlayed(${gamesPlayed}) != wins(${team.teamWins}) + losses(${team.teamLosses})`,
            );
          }
        }
      }

      if (violations.length > 0) {
        console.warn(
          `Team record anomalies: ${violations.slice(0, 5).join("\n")}`,
        );
      }
      expect(violations.length).toBeLessThan(20);
    });

    it("team goals should never exceed shots", () => {
      const violations: string[] = [];

      for (const year of YEARS) {
        const teams = yearTeams[year] ?? [];

        for (const team of teams) {
          if (!team.stats) continue;
          const { goals, shots } = team.stats;

          if (goals > shots) {
            violations.push(
              `${year} ${team.fullName}: goals(${goals}) > shots(${shots})`,
            );
          }
        }
      }

      expect(violations).toHaveLength(0);
    });
  });

  describe("Cross-File Consistency", () => {
    it("player slugs should be unique across all sources", () => {
      const slugCounts = new Map<string, number>();

      for (const player of playerDetails) {
        slugCounts.set(player.slug, (slugCounts.get(player.slug) ?? 0) + 1);
      }

      const duplicates = [...slugCounts.entries()].filter(
        ([, count]) => count > 1,
      );
      expect(duplicates).toHaveLength(0);
    });

    it("player officialIds should be unique in player-details", () => {
      const idCounts = new Map<string, number>();

      for (const player of playerDetails) {
        idCounts.set(
          player.officialId,
          (idCounts.get(player.officialId) ?? 0) + 1,
        );
      }

      const duplicates = [...idCounts.entries()].filter(
        ([, count]) => count > 1,
      );
      expect(duplicates).toHaveLength(0);
    });

    it("career stats totals should roughly match sum of season stats", () => {
      const violations: string[] = [];

      for (const player of playerDetails) {
        if (!player.careerStats || player.allSeasonStats.length === 0) continue;

        const seasonTotals = player.allSeasonStats.reduce(
          (acc, season) => ({
            goals: acc.goals + season.goals,
            assists: acc.assists + season.assists,
            gamesPlayed: acc.gamesPlayed + season.gamesPlayed,
          }),
          { goals: 0, assists: 0, gamesPlayed: 0 },
        );

        const goalDiff = Math.abs(
          seasonTotals.goals - player.careerStats.goals,
        );
        const assistDiff = Math.abs(
          seasonTotals.assists - player.careerStats.assists,
        );

        if (goalDiff > 5 || assistDiff > 5) {
          violations.push(
            `${player.firstName} ${player.lastName}: career(${player.careerStats.goals}g/${player.careerStats.assists}a) vs seasons(${seasonTotals.goals}g/${seasonTotals.assists}a)`,
          );
        }
      }

      if (violations.length > 0) {
        console.warn(`Career/season stat mismatches: ${violations.length}`);
        console.warn(violations.slice(0, 5).join("\n"));
      }
      expect(violations.length).toBeLessThan(50);
    });
  });

  describe("Data Completeness", () => {
    it("should have player details for all years", () => {
      if (!requireLoadedData()) return;
      expect(playerDetails.length).toBeGreaterThan(400);
    });

    it("should have career stats for PLL and MLL players", () => {
      if (!requireLoadedData()) return;

      const pllCount = careerStats.filter(
        (player) => player.likelySource === "pll",
      ).length;
      const mllCount = careerStats.filter(
        (player) => player.likelySource === "mll_or_retired",
      ).length;

      expect(pllCount).toBeGreaterThan(300);
      expect(mllCount).toBeGreaterThan(700);
    });

    it("should have data for all PLL years (2019-2025)", () => {
      if (!requireLoadedData()) return;

      for (const year of YEARS) {
        expect(yearPlayers[year]?.length).toBeGreaterThan(100);
        expect(yearTeams[year]?.length).toBeGreaterThanOrEqual(6);
      }
    });

    it("2019 should have 6 teams, 2020 should have 7, 2021+ should have 8", () => {
      if (!requireLoadedData()) return;

      expect(yearTeams["2019"]?.length).toBe(6);
      expect(yearTeams["2020"]?.length).toBe(7);
      expect(yearTeams["2021"]?.length).toBe(8);
      expect(yearTeams["2022"]?.length).toBe(8);
      expect(yearTeams["2023"]?.length).toBe(8);
      expect(yearTeams["2024"]?.length).toBe(8);
      expect(yearTeams["2025"]?.length).toBe(8);
    });
  });
});
