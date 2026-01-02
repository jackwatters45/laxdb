import { describe, expect, it, beforeAll } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const OUTPUT_DIR = path.join(__dirname, "../../output/pll");

interface PlayerDetail {
  slug: string;
  officialId: string;
  firstName: string;
  lastName: string;
  careerStats: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    shots: number;
    shotPct: number;
    saves: number;
    savePct: number;
    faceoffsWon: number;
    faceoffs: number;
    faceoffPct: number;
  } | null;
  allSeasonStats: Array<{
    year: number;
    seasonSegment: string;
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    shots: number;
  }>;
}

interface CareerStatsPlayer {
  slug: string | null;
  name: string;
  experience: number | null;
  allYears: number[] | null;
  stats: {
    gamesPlayed: number;
    points: number;
    goals: number;
    assists: number;
    groundBalls: number;
    saves: number;
    faceoffsWon: number;
  };
  inPlayerDetails: boolean;
  likelySource: "pll" | "mll_or_retired";
}

interface YearPlayer {
  officialId: string;
  firstName: string;
  lastName: string;
  slug: string | null;
  allTeams: Array<{
    officialId: string;
    year: number;
    position: string | null;
  }>;
  stats?: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    shots: number;
  };
}

interface YearTeam {
  officialId: string;
  fullName: string;
  teamWins: number;
  teamLosses: number;
  stats: {
    gamesPlayed: number;
    goals: number;
    shots: number;
  } | null;
}

let playerDetails: PlayerDetail[] = [];
let careerStats: CareerStatsPlayer[] = [];
let yearPlayers: Record<string, YearPlayer[]> = {};
let yearTeams: Record<string, YearTeam[]> = {};

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

beforeAll(async () => {
  try {
    const pdContent = await fs.readFile(
      path.join(OUTPUT_DIR, "player-details.json"),
      "utf-8",
    );
    playerDetails = JSON.parse(pdContent);
  } catch {
    playerDetails = [];
  }

  try {
    const csContent = await fs.readFile(
      path.join(OUTPUT_DIR, "career-stats.json"),
      "utf-8",
    );
    careerStats = JSON.parse(csContent);
  } catch {
    careerStats = [];
  }

  await Promise.all(
    YEARS.map(async (year) => {
      try {
        const content = await fs.readFile(
          path.join(OUTPUT_DIR, year, "players.json"),
          "utf-8",
        );
        yearPlayers[year] = JSON.parse(content);
      } catch {
        yearPlayers[year] = [];
      }

      try {
        const content = await fs.readFile(
          path.join(OUTPUT_DIR, year, "teams.json"),
          "utf-8",
        );
        yearTeams[year] = JSON.parse(content);
      } catch {
        yearTeams[year] = [];
      }
    }),
  );
});

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
      const bridgePlayers = careerStats.filter((p) => {
        if (p.likelySource !== "pll" || !p.allYears) return false;
        const hasPrePLL = p.allYears.some((y) => y < 2019);
        const hasPLL = p.allYears.some((y) => y >= 2019);
        return hasPrePLL && hasPLL;
      });

      expect(bridgePlayers.length).toBeGreaterThan(100);
      console.log(`Found ${bridgePlayers.length} bridge players (MLL → PLL)`);
    });

    it("MLL players should have years < 2019 (mostly)", () => {
      const mllPlayers = careerStats.filter(
        (p) => p.likelySource === "mll_or_retired",
      );
      const mllWithOnlyPostPLL = mllPlayers.filter((p) => {
        if (!p.allYears) return false;
        return p.allYears.every((y) => y >= 2019);
      });

      expect(mllWithOnlyPostPLL.length).toBeLessThan(mllPlayers.length * 0.1);
    });

    it("inPlayerDetails flag should be accurate", () => {
      const playerDetailSlugs = new Set(playerDetails.map((p) => p.slug));
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
          playerIdsBySlug.get(player.slug)!.add(player.officialId);
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
          (acc, s) => ({
            goals: acc.goals + s.goals,
            assists: acc.assists + s.assists,
            gamesPlayed: acc.gamesPlayed + s.gamesPlayed,
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
      expect(playerDetails.length).toBeGreaterThan(400);
    });

    it("should have career stats for PLL and MLL players", () => {
      const pllCount = careerStats.filter(
        (p) => p.likelySource === "pll",
      ).length;
      const mllCount = careerStats.filter(
        (p) => p.likelySource === "mll_or_retired",
      ).length;

      expect(pllCount).toBeGreaterThan(300);
      expect(mllCount).toBeGreaterThan(700);
    });

    it("should have data for all PLL years (2019-2025)", () => {
      for (const year of YEARS) {
        expect(yearPlayers[year]?.length).toBeGreaterThan(100);
        expect(yearTeams[year]?.length).toBeGreaterThanOrEqual(6);
      }
    });

    it("2019 should have 6 teams, 2020 should have 7, 2021+ should have 8", () => {
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
