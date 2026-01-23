// Pro League Domain - Professional lacrosse league data (PLL, NLL, MLL, MSL, WLA)

// SQL Tables
export {
  proLeagueTable,
  proSeasonTable,
  proTeamTable,
  proPlayerTable,
  proPlayerSeasonTable,
  proGameTable,
  proStandingsTable,
  proDataIngestionTable,
  type ProLeague,
  type ProLeagueInsert,
  type ProSeason,
  type ProSeasonInsert,
  type ProTeam,
  type ProTeamInsert,
  type ProPlayer,
  type ProPlayerInsert,
  type ProPlayerSeason,
  type ProPlayerSeasonInsert,
  type ProGame,
  type ProGameInsert,
  type ProStandings,
  type ProStandingsInsert,
  type ProDataIngestion,
  type ProDataIngestionInsert,
} from "./pro-league.sql";

// JSONB Types
export type {
  PlayerStats,
  GoalieStats,
  TeamStats,
  PlayByPlayAction,
  GamePlayByPlay,
} from "./pro-league.types";

export { isPLLStats, isNLLStats, hasGoalieStats } from "./pro-league.types";

// Effect Schemas
export {
  LeagueCode,
  GameStatus,
  IngestionStatus,
  EntityType,
  SourceType,
  CreateLeagueInput,
  LeagueOutput,
  UpsertSeasonInput,
  SeasonOutput,
  UpsertTeamInput,
  TeamOutput,
  UpsertPlayerInput,
  PlayerOutput,
  UpsertPlayerSeasonInput,
  UpsertGameInput,
  GameOutput,
  UpsertStandingsInput,
  CreateIngestionInput,
  UpdateIngestionInput,
  GetByLeagueInput,
  GetBySeasonInput,
  GetByLeagueAndYearInput,
  GetStandingsInput,
} from "./pro-league.schema";

// Errors
export {
  ProLeagueNotFoundError,
  ProSeasonNotFoundError,
  ProTeamNotFoundError,
  ProPlayerNotFoundError,
  ProGameNotFoundError,
  ProIngestionError,
  ProUpsertError,
} from "./pro-league.error";

// Repository
export { ProLeagueRepo } from "./pro-league.repo";

// Service
export { ProLeagueService } from "./pro-league.service";
