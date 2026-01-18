// NLL Data (2025-26 Season)
import nllStandings from "../../../packages/pipeline/output/nll/225/standings.json";
import nllTeams from "../../../packages/pipeline/output/nll/225/teams.json";
import nllSchedule from "../../../packages/pipeline/output/nll/225/schedule.json";
import nllPlayerStats from "../../../packages/pipeline/output/nll/225/player-stats.json";

// PLL Data (2025 Season)
import pllStandings from "../../../packages/pipeline/output/pll/2025/standings.json";
import pllEvents from "../../../packages/pipeline/output/pll/2025/events.json";
import pllPlayers from "../../../packages/pipeline/output/pll/2025/players.json";

// Type definitions
interface NLLStanding {
  team_id: string;
  name: string;
  wins: number;
  losses: number;
  games_played: number;
  win_percentage: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  position: number;
}

interface NLLTeam {
  id: string;
  code: string;
  displayName: string;
  team_city: string;
  team_logo: string;
}

interface NLLGame {
  id: string;
  date: string;
  status: string;
  venue: { name: string };
  squads: {
    away: { name: string; code: string; score: number };
    home: { name: string; code: string; score: number };
  };
}

interface NLLPlayerStat {
  personId: string;
  fullname: string;
  position: string | null;
  team_code: string | null;
  team_name: string | null;
  games_played: number;
  goals: number;
  assists: number;
  points: number;
  penalty_minutes: number;
  ppg: number;
  ppa: number;
  shg: number;
  looseballs: number;
  turnovers: number;
  caused_turnovers: number;
  blocked_shots: number;
  shots_on_goal: number;
}

interface PLLStanding {
  teamId: string;
  fullName: string;
  location: string;
  wins: number;
  losses: number;
  ties: number;
  scores: number;
  scoresAgainst: number;
  scoreDiff: number;
  conference: string;
}

interface PLLEvent {
  league: string;
  startTime: string;
  venue: string;
  location: string;
  eventStatus: number;
  homeScore: number;
  visitorScore: number;
  homeTeam: { fullName: string; location: string };
  awayTeam: { fullName: string; location: string };
}

interface PLLPlayer {
  firstName: string;
  lastName: string;
  allTeams: Array<{ fullName: string; position: string; locationCode: string; year: number }>;
  stats: {
    gamesPlayed: number;
    goals: number;
    twoPointGoals: number;
    assists: number;
    points: number;
    shots: number;
    groundBalls: number;
    turnovers: number;
    causedTurnovers: number;
  };
}

// Create team lookup for NLL
const nllTeamMap = new Map((nllTeams as NLLTeam[]).map((t) => [t.id, t]));

// Transform NLL standings for DataTable
export const nllStandingsData = (nllStandings as NLLStanding[]).map((s) => {
  const team = nllTeamMap.get(s.team_id);
  return {
    team: team?.displayName ?? s.name,
    code: team?.code ?? "",
    wins: s.wins,
    losses: s.losses,
    gp: s.games_played,
    pct: (s.win_percentage * 100).toFixed(1) + "%",
    gf: s.goals_for,
    ga: s.goals_against,
    diff: s.goal_diff > 0 ? `+${s.goal_diff}` : String(s.goal_diff),
  };
});

// Transform NLL schedule for DataTable (most recent 15 games)
export const nllScheduleData = (nllSchedule as NLLGame[])
  .filter((g) => g.status === "Complete")
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 15)
  .map((g) => ({
    date: new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    away: g.squads.away.code,
    awayScore: g.squads.away.score,
    home: g.squads.home.code,
    homeScore: g.squads.home.score,
    venue: g.venue.name.length > 25 ? g.venue.name.slice(0, 22) + "..." : g.venue.name,
  }));

// Transform NLL players for stats (top 20 scorers)
export const nllPlayerStatsData = (nllPlayerStats as NLLPlayerStat[])
  .filter((p) => p.games_played > 0)
  .sort((a, b) => b.points - a.points)
  .slice(0, 20)
  .map((p, idx) => ({
    rank: idx + 1,
    player: p.fullname,
    team: p.team_code ?? "",
    pos: p.position ?? "",
    gp: p.games_played,
    g: p.goals,
    a: p.assists,
    pts: p.points,
    pim: p.penalty_minutes,
  }));

// Transform PLL standings for DataTable
export const pllStandingsData = (pllStandings as PLLStanding[])
  .sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.scoreDiff - a.scoreDiff;
  })
  .map((s, idx) => ({
    rank: idx + 1,
    team: `${s.location} ${s.fullName}`,
    conf: s.conference === "eastern" ? "East" : "West",
    wins: s.wins,
    losses: s.losses,
    gf: s.scores,
    ga: s.scoresAgainst,
    diff: s.scoreDiff > 0 ? `+${s.scoreDiff}` : String(s.scoreDiff),
  }));

// Transform PLL events for schedule (PLL games only, most recent 15)
export const pllScheduleData = (pllEvents as PLLEvent[])
  .filter((e) => e.league === "PLL" && e.eventStatus === 3) // completed PLL games
  .sort((a, b) => Number(b.startTime) - Number(a.startTime))
  .slice(0, 15)
  .map((e) => {
    const date = new Date(Number(e.startTime) * 1000);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      away: e.awayTeam.fullName,
      awayScore: e.visitorScore,
      home: e.homeTeam.fullName,
      homeScore: e.homeScore,
      venue: e.venue.length > 20 ? e.venue.slice(0, 17) + "..." : e.venue,
    };
  });

// Transform PLL players for stats (top 20 scorers from 2025)
export const pllPlayerStats = (pllPlayers as PLLPlayer[])
  .filter((p) => {
    const team2025 = p.allTeams.find((t) => t.year === 2025 || t.year === 2026);
    return team2025 && p.stats.gamesPlayed > 0;
  })
  .sort((a, b) => b.stats.points - a.stats.points)
  .slice(0, 20)
  .map((p, idx) => {
    const team = p.allTeams.find((t) => t.year === 2025 || t.year === 2026);
    return {
      rank: idx + 1,
      player: `${p.firstName} ${p.lastName}`,
      team: team?.locationCode ?? "",
      pos: team?.position ?? "",
      gp: p.stats.gamesPlayed,
      g: p.stats.goals,
      a: p.stats.assists,
      pts: p.stats.points,
      gb: p.stats.groundBalls,
    };
  });

// Calculate NLL league totals
const nllTotals = (nllStandings as NLLStanding[]).reduce(
  (acc, s) => ({
    games: acc.games + s.games_played,
    goalsFor: acc.goalsFor + s.goals_for,
    goalsAgainst: acc.goalsAgainst + s.goals_against,
  }),
  { games: 0, goalsFor: 0, goalsAgainst: 0 }
);

// Calculate PLL league totals
const pllTotals = (pllStandings as PLLStanding[]).reduce(
  (acc, s) => ({
    games: acc.games + s.wins + s.losses,
    goalsFor: acc.goalsFor + s.scores,
    goalsAgainst: acc.goalsAgainst + s.scoresAgainst,
  }),
  { games: 0, goalsFor: 0, goalsAgainst: 0 }
);

// Combined data object for DataProvider
export const lacrosseData = {
  nll: {
    standings: nllStandingsData,
    schedule: nllScheduleData,
    players: nllPlayerStatsData,
    metrics: {
      teams: 14,
      gamesPlayed: nllTotals.games / 2,
      totalGoals: nllTotals.goalsFor,
      avgGoalsPerGame: Number((nllTotals.goalsFor / (nllTotals.games / 2)).toFixed(1)),
    },
  },
  pll: {
    standings: pllStandingsData,
    schedule: pllScheduleData,
    players: pllPlayerStats,
    metrics: {
      teams: 8,
      gamesPlayed: pllTotals.games / 2,
      totalGoals: pllTotals.goalsFor,
      avgGoalsPerGame: Number((pllTotals.goalsFor / (pllTotals.games / 2)).toFixed(1)),
    },
  },
};
