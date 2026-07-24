import { Schema } from "effect";

export const GamedayId = Schema.String.check(Schema.isMinLength(1));
export const GamedayNullableId = Schema.NullOr(GamedayId);

const Count = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
);
const Score = Schema.Number.check(Schema.isInt());

export const LACROSSE_VICTORIA_GAMEDAY_SOURCE_ID = "lacrosse-victoria";
export const LACROSSE_VICTORIA_GAMEDAY_SOURCE_NAME = "Lacrosse Victoria";

export class SyncedGamedaySource extends Schema.Class<SyncedGamedaySource>(
  "SyncedGamedaySource",
)({
  id: GamedayId,
  name: Schema.String,
  clientId: GamedayId,
  baseUrl: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class SyncedGamedaySeason extends Schema.Class<SyncedGamedaySeason>(
  "SyncedGamedaySeason",
)({
  id: GamedayId,
  sourceId: GamedayId,
  seasonId: GamedayId,
  name: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class SyncedGamedayCompetition extends Schema.Class<SyncedGamedayCompetition>(
  "SyncedGamedayCompetition",
)({
  id: GamedayId,
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  name: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class SyncedGamedayTeam extends Schema.Class<SyncedGamedayTeam>(
  "SyncedGamedayTeam",
)({
  id: GamedayId,
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  teamId: GamedayId,
  name: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class SyncedGamedayFixture extends Schema.Class<SyncedGamedayFixture>(
  "SyncedGamedayFixture",
)({
  id: GamedayId,
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  fixtureId: GamedayId,
  compName: Schema.NullOr(Schema.String),
  round: Schema.NullOr(Schema.String),
  scheduledAt: Schema.NullOr(Schema.Date),
  homeTeamId: GamedayNullableId,
  awayTeamId: GamedayNullableId,
  homeTeamName: Schema.String,
  awayTeamName: Schema.String,
  venueName: Schema.NullOr(Schema.String),
  matchStatus: Schema.NullOr(Schema.String),
  homeScore: Schema.NullOr(Score),
  awayScore: Schema.NullOr(Score),
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class SyncedGamedayPlayer extends Schema.Class<SyncedGamedayPlayer>(
  "SyncedGamedayPlayer",
)({
  id: GamedayId,
  sourceId: GamedayId,
  playerId: GamedayId,
  name: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class SyncedGamedayRosterEntry extends Schema.Class<SyncedGamedayRosterEntry>(
  "SyncedGamedayRosterEntry",
)({
  id: GamedayId,
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  teamId: GamedayId,
  playerId: GamedayId,
  playerName: Schema.String,
  gamesPlayed: Schema.NullOr(Count),
  totalAssists: Schema.NullOr(Count),
  totalScore: Schema.NullOr(Count),
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class ClubTeamGamedayLink extends Schema.Class<ClubTeamGamedayLink>(
  "ClubTeamGamedayLink",
)({
  id: GamedayId,
  organizationId: GamedayId,
  clubTeamId: GamedayId,
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  gamedayTeamId: GamedayId,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class RosterPlayerGamedayLink extends Schema.Class<RosterPlayerGamedayLink>(
  "RosterPlayerGamedayLink",
)({
  id: GamedayId,
  organizationId: GamedayId,
  rosterPlayerId: GamedayId,
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  gamedayTeamId: GamedayId,
  gamedayPlayerId: GamedayId,
  createdAt: Schema.Date,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class UpsertGamedaySourceInput extends Schema.Class<UpsertGamedaySourceInput>(
  "UpsertGamedaySourceInput",
)({
  id: GamedayId,
  name: Schema.String,
  clientId: GamedayId,
  baseUrl: Schema.String,
}) {}

export class UpsertSyncedGamedaySeasonInput extends Schema.Class<UpsertSyncedGamedaySeasonInput>(
  "UpsertSyncedGamedaySeasonInput",
)({
  sourceId: GamedayId,
  seasonId: GamedayId,
  name: Schema.String,
}) {}

export class UpsertSyncedGamedayCompetitionInput extends Schema.Class<UpsertSyncedGamedayCompetitionInput>(
  "UpsertSyncedGamedayCompetitionInput",
)({
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  name: Schema.String,
}) {}

export class UpsertSyncedGamedayTeamInput extends Schema.Class<UpsertSyncedGamedayTeamInput>(
  "UpsertSyncedGamedayTeamInput",
)({
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  teamId: GamedayId,
  name: Schema.String,
}) {}

export class UpsertSyncedGamedayFixtureInput extends Schema.Class<UpsertSyncedGamedayFixtureInput>(
  "UpsertSyncedGamedayFixtureInput",
)({
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  fixtureId: GamedayId,
  compName: Schema.NullOr(Schema.String),
  round: Schema.NullOr(Schema.String),
  scheduledAt: Schema.NullOr(Schema.Date),
  homeTeamId: GamedayNullableId,
  awayTeamId: GamedayNullableId,
  homeTeamName: Schema.String,
  awayTeamName: Schema.String,
  venueName: Schema.NullOr(Schema.String),
  matchStatus: Schema.NullOr(Schema.String),
  homeScore: Schema.NullOr(Score),
  awayScore: Schema.NullOr(Score),
}) {}

export class UpsertSyncedGamedayPlayerInput extends Schema.Class<UpsertSyncedGamedayPlayerInput>(
  "UpsertSyncedGamedayPlayerInput",
)({
  sourceId: GamedayId,
  playerId: GamedayId,
  name: Schema.String,
}) {}

export class UpsertSyncedGamedayRosterEntryInput extends Schema.Class<UpsertSyncedGamedayRosterEntryInput>(
  "UpsertSyncedGamedayRosterEntryInput",
)({
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  teamId: GamedayId,
  playerId: GamedayId,
  playerName: Schema.String,
  gamesPlayed: Schema.NullOr(Count),
  totalAssists: Schema.NullOr(Count),
  totalScore: Schema.NullOr(Count),
}) {}

export class UpsertClubTeamGamedayLinkInput extends Schema.Class<UpsertClubTeamGamedayLinkInput>(
  "UpsertClubTeamGamedayLinkInput",
)({
  organizationId: GamedayId,
  clubTeamId: GamedayId,
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  gamedayTeamId: GamedayId,
}) {}

export class UpsertRosterPlayerGamedayLinkInput extends Schema.Class<UpsertRosterPlayerGamedayLinkInput>(
  "UpsertRosterPlayerGamedayLinkInput",
)({
  organizationId: GamedayId,
  rosterPlayerId: GamedayId,
  sourceId: GamedayId,
  seasonId: GamedayId,
  compId: GamedayId,
  gamedayTeamId: GamedayId,
  gamedayPlayerId: GamedayId,
}) {}

export class ImportGamedayTeamSelection extends Schema.Class<ImportGamedayTeamSelection>(
  "ImportGamedayTeamSelection",
)({
  compId: GamedayId,
  compName: Schema.String,
  teamId: GamedayId,
  teamName: Schema.String,
}) {}

export class ImportGamedayTeamsInput extends Schema.Class<ImportGamedayTeamsInput>(
  "ImportGamedayTeamsInput",
)({
  organizationId: GamedayId,
  seasonId: GamedayId,
  teams: Schema.Array(ImportGamedayTeamSelection),
}) {}

export class ImportGamedayTeamsResult extends Schema.Class<ImportGamedayTeamsResult>(
  "ImportGamedayTeamsResult",
)({
  teams: Count,
  links: Count,
  fixtures: Count,
  rosterPlayers: Count,
  rosterLinks: Count,
}) {}

export class SyncGamedayRosterInput extends Schema.Class<SyncGamedayRosterInput>(
  "SyncGamedayRosterInput",
)({
  organizationId: GamedayId,
  teamId: GamedayId,
}) {}

export class SyncGamedayRosterResult extends Schema.Class<SyncGamedayRosterResult>(
  "SyncGamedayRosterResult",
)({
  fetched: Count,
  created: Count,
  linked: Count,
  existing: Count,
  unresolved: Count,
}) {}

export class SyncGamedayAssociationSeasonInput extends Schema.Class<SyncGamedayAssociationSeasonInput>(
  "SyncGamedayAssociationSeasonInput",
)({
  sourceId: Schema.optional(GamedayId),
  seasonId: Schema.optional(GamedayId),
  includeRosters: Schema.optional(Schema.Boolean),
}) {}

export class SyncGamedayAssociationSeasonResult extends Schema.Class<SyncGamedayAssociationSeasonResult>(
  "SyncGamedayAssociationSeasonResult",
)({
  sourceId: GamedayId,
  sourceName: Schema.String,
  seasonId: GamedayId,
  seasonName: Schema.String,
  competitions: Count,
  teams: Count,
  fixtures: Count,
  players: Count,
  rosterEntries: Count,
}) {}
