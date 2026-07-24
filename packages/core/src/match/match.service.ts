import { ClubRepo } from "@laxdb/core/club/club.repo";
import type { ClubTeam, RosterPlayer } from "@laxdb/core/club/club.sql";
import { EmailService } from "@laxdb/core/email/email.service";
import { NotFoundError, ValidationError } from "@laxdb/core/error";
import {
  decodeArguments,
  parseSqlError,
  type SchemaInput,
} from "@laxdb/core/util";
import { Context, Effect, Layer, Option } from "effect";
import { nanoid } from "nanoid";

import {
  GAMEDAY_BASE_URL,
  GamedayClient,
  GamedayTeamCompetition,
  LACROSSE_VICTORIA_CLIENT,
  gamedayDate,
  gamedayMatchName,
  gamedayScore,
  gamedayTeamsFromMatches,
  type GamedayMatch,
} from "./gameday";
import { GamedayRepo } from "./gameday.repo";
import type { ImportGamedayTeamSelection } from "./gameday.schema";
import {
  ImportGamedayTeamsInput,
  ImportGamedayTeamsResult,
  LACROSSE_VICTORIA_GAMEDAY_SOURCE_ID,
  LACROSSE_VICTORIA_GAMEDAY_SOURCE_NAME,
  SyncGamedayAssociationSeasonInput,
  SyncGamedayAssociationSeasonResult,
  UpsertClubTeamGamedayLinkInput,
  UpsertGamedaySourceInput,
  UpsertRosterPlayerGamedayLinkInput,
  UpsertSyncedGamedayCompetitionInput,
  UpsertSyncedGamedayFixtureInput,
  UpsertSyncedGamedayPlayerInput,
  UpsertSyncedGamedayRosterEntryInput,
  UpsertSyncedGamedaySeasonInput,
  UpsertSyncedGamedayTeamInput,
} from "./gameday.schema";
import type { GamedayFixtureRow } from "./gameday.sql";
import { MatchRepo, type UpsertFixture } from "./match.repo";
import {
  CreateMatchImageInput,
  DeleteMatchImageInput,
  Fixture,
  FixtureByIdInput,
  GetMatchImageInput,
  ListFixturesInput,
  ListMatchImagesInput,
  ListReportsInput,
  MatchImage,
  MatchReport,
  SubmitReportInput,
  SyncFixturesInput,
  SyncFixturesResult,
} from "./match.schema";
import type { Fixture as FixtureRow } from "./match.sql";

const asFixture = (row: typeof Fixture.Type) => new Fixture(row);
const asReport = (row: typeof MatchReport.Type) => new MatchReport(row);
const asImage = (row: typeof MatchImage.Type) => new MatchImage(row);

const notFound = (domain: string, id: string | number) =>
  new NotFoundError({ domain, id });

const toSyncedGamedayFixture = (input: {
  readonly sourceId: string;
  readonly seasonId: string;
  readonly compId: string;
  readonly match: GamedayMatch;
}) =>
  new UpsertSyncedGamedayFixtureInput({
    sourceId: input.sourceId,
    seasonId: input.seasonId,
    compId: input.compId,
    fixtureId: input.match.FixtureID,
    compName: input.match.CompName?.trim() ?? null,
    round: input.match.Round ?? null,
    scheduledAt: gamedayDate(input.match.TimeDateRaw),
    homeTeamId: input.match.HomeID ?? null,
    awayTeamId: input.match.AwayID ?? null,
    homeTeamName: gamedayMatchName(input.match, "home"),
    awayTeamName: gamedayMatchName(input.match, "away"),
    venueName: input.match.VenueName ?? null,
    matchStatus: input.match.MatchStatus ?? null,
    homeScore: gamedayScore(input.match.HomeScore),
    awayScore: gamedayScore(input.match.AwayScore),
  });

const localTeamName = (selection: typeof ImportGamedayTeamSelection.Type) =>
  selection.teamName === "Malvern Lacrosse Club"
    ? selection.compName
    : `${selection.compName} — ${selection.teamName}`;

const normalizeName = (value: string) => value.trim().toLocaleLowerCase();

const toProjectedFixture = (input: {
  readonly team: ClubTeam;
  readonly link: { readonly gamedayTeamId: string };
  readonly fixture: GamedayFixtureRow;
}): UpsertFixture => ({
  organizationId: input.team.organizationId,
  teamId: input.team.id,
  gamedayFixtureId: input.fixture.fixtureId,
  compId: input.fixture.compId,
  compName: input.fixture.compName,
  round: input.fixture.round,
  scheduledAt: input.fixture.scheduledAt,
  homeTeamName: input.fixture.homeTeamName,
  awayTeamName: input.fixture.awayTeamName,
  isHome: input.fixture.homeTeamId === input.link.gamedayTeamId,
  venueName: input.fixture.venueName,
  matchStatus: input.fixture.matchStatus,
  homeScore: input.fixture.homeScore,
  awayScore: input.fixture.awayScore,
});

const fixtureResultLine = (fixture: FixtureRow) => {
  const opponent = fixture.isHome ? fixture.awayTeamName : fixture.homeTeamName;
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return `vs ${opponent}`;
  }
  const ours = fixture.isHome ? fixture.homeScore : fixture.awayScore;
  const theirs = fixture.isHome ? fixture.awayScore : fixture.homeScore;
  const outcome = ours > theirs ? "Win" : ours < theirs ? "Loss" : "Draw";
  return `${outcome} ${ours}–${theirs} vs ${opponent}`;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const safeFileName = (value: string) => {
  const cleaned = value
    .trim()
    .replaceAll(/[^A-Za-z0-9._-]/gu, "-")
    .replaceAll(/-+/gu, "-");
  return cleaned === "" ? "image" : cleaned;
};

const buildReportEmail = (input: {
  readonly team: ClubTeam;
  readonly fixture: FixtureRow;
  readonly topPlayers: readonly RosterPlayer[];
  readonly blurb: string | null;
  readonly submitterName: string | null;
}) => {
  const { team, fixture, topPlayers, blurb, submitterName } = input;
  const round = fixture.round === null ? "" : ` (Round ${fixture.round})`;
  const result = fixtureResultLine(fixture);
  const subject = `Match report: ${team.name} — ${result}${round}`;

  const playerLines = topPlayers.map((player, index) => {
    const jersey =
      player.jerseyNumber === null ? "" : ` (#${player.jerseyNumber})`;
    return `${index + 1}. ${player.name}${jersey}`;
  });

  const textParts = [
    `${team.name}${round}`,
    result,
    fixture.venueName === null ? null : `Venue: ${fixture.venueName}`,
    "",
    "Top three players:",
    ...playerLines,
    ...(blurb === null || blurb === "" ? [] : ["", blurb]),
    "",
    submitterName === null ? null : `Submitted by ${submitterName}`,
  ].filter((line): line is string => line !== null);

  const htmlParts = [
    `<h2>${escapeHtml(team.name)}${escapeHtml(round)}</h2>`,
    `<p><strong>${escapeHtml(result)}</strong></p>`,
    fixture.venueName === null
      ? ""
      : `<p>Venue: ${escapeHtml(fixture.venueName)}</p>`,
    "<h3>Top three players</h3>",
    `<ol>${topPlayers
      .map((player) => {
        const jersey =
          player.jerseyNumber === null ? "" : ` (#${player.jerseyNumber})`;
        return `<li>${escapeHtml(player.name)}${escapeHtml(jersey)}</li>`;
      })
      .join("")}</ol>`,
    blurb === null || blurb === ""
      ? ""
      : `<p>${escapeHtml(blurb).replaceAll("\n", "<br>")}</p>`,
    submitterName === null
      ? ""
      : `<p><em>Submitted by ${escapeHtml(submitterName)}</em></p>`,
  ];

  return {
    subject,
    text: textParts.join("\n"),
    html: htmlParts.filter((part) => part !== "").join("\n"),
  };
};

export class MatchService extends Context.Service<MatchService>()(
  "MatchService",
  {
    make: Effect.gen(function* () {
      const repo = yield* MatchRepo;
      const clubRepo = yield* ClubRepo;
      const gameday = yield* GamedayClient;
      const gamedayRepo = yield* GamedayRepo;
      const email = yield* EmailService;

      return {
        listFixtures: (input: SchemaInput<typeof ListFixturesInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(ListFixturesInput, input);
            return yield* repo.listFixtures(decoded);
          }).pipe(
            Effect.map((rows) => rows.map(asFixture)),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to list fixtures", e),
            ),
          ),

        getFixture: (input: SchemaInput<typeof FixtureByIdInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(FixtureByIdInput, input);
            return yield* repo.getFixture(decoded);
          }).pipe(
            Effect.map(asFixture),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("Fixture", input.id)),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) => Effect.logError("Failed to get fixture", e)),
          ),

        syncFixtures: (input: SchemaInput<typeof SyncFixturesInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(SyncFixturesInput, input);
            const team = yield* clubRepo
              .getTeam({
                organizationId: decoded.organizationId,
                id: decoded.teamId,
              })
              .pipe(
                Effect.catchTag("NoSuchElementError", () =>
                  Effect.fail(notFound("ClubTeam", decoded.teamId)),
                ),
              );
            const links = yield* gamedayRepo.listClubTeamLinks({
              organizationId: decoded.organizationId,
              clubTeamId: decoded.teamId,
            });
            if (links.length === 0) {
              return yield* Effect.fail(
                new ValidationError({
                  domain: "Fixture",
                  message:
                    "Team is not linked to a GameDay squad — link/import it in admin before syncing fixtures",
                }),
              );
            }

            const projected = yield* Effect.forEach(
              links,
              (link) =>
                Effect.gen(function* () {
                  const matches = yield* gameday.fetchFixtures(link.compId);
                  yield* gamedayRepo.upsertFixtures(
                    matches
                      .filter((match) => match.isBye !== 1)
                      .map((match) =>
                        toSyncedGamedayFixture({
                          sourceId: link.sourceId,
                          seasonId: link.seasonId,
                          compId: link.compId,
                          match,
                        }),
                      ),
                  );
                  const syncedFixtures =
                    yield* gamedayRepo.listFixturesForClubTeamLink({
                      sourceId: link.sourceId,
                      seasonId: link.seasonId,
                      compId: link.compId,
                      gamedayTeamId: link.gamedayTeamId,
                    });
                  return yield* repo.upsertFixtures(
                    syncedFixtures.map((fixture) =>
                      toProjectedFixture({ team, link, fixture }),
                    ),
                  );
                }),
              { concurrency: 2 },
            );

            return new SyncFixturesResult({
              synced: projected.reduce((total, count) => total + count, 0),
              compName: null,
            });
          }).pipe(
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tap((result) =>
              Effect.log(`Synced ${result.synced} fixtures`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to sync fixtures", e),
            ),
          ),

        syncGamedayAssociationSeason: (
          input: SchemaInput<typeof SyncGamedayAssociationSeasonInput>,
        ) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              SyncGamedayAssociationSeasonInput,
              input,
            );
            const sourceId =
              decoded.sourceId ?? LACROSSE_VICTORIA_GAMEDAY_SOURCE_ID;
            if (sourceId !== LACROSSE_VICTORIA_GAMEDAY_SOURCE_ID) {
              return yield* Effect.fail(
                new ValidationError({
                  domain: "GameDay",
                  message: `Unsupported GameDay source: ${sourceId}`,
                }),
              );
            }

            const seasons = yield* gameday.fetchSeasons();
            const selectedSeason =
              decoded.seasonId === undefined
                ? seasons[0]
                : seasons.find(
                    (season) => season.seasonId === decoded.seasonId,
                  );
            if (selectedSeason === undefined) {
              return yield* Effect.fail(
                new ValidationError({
                  domain: "GameDay",
                  message:
                    decoded.seasonId === undefined
                      ? "GameDay did not return any seasons"
                      : `GameDay season not found: ${decoded.seasonId}`,
                }),
              );
            }

            yield* gamedayRepo.upsertSource(
              new UpsertGamedaySourceInput({
                id: sourceId,
                name: LACROSSE_VICTORIA_GAMEDAY_SOURCE_NAME,
                clientId: LACROSSE_VICTORIA_CLIENT,
                baseUrl: GAMEDAY_BASE_URL,
              }),
            );
            yield* gamedayRepo.upsertSeasons(
              seasons.map(
                (season) =>
                  new UpsertSyncedGamedaySeasonInput({
                    sourceId,
                    seasonId: season.seasonId,
                    name: season.name,
                  }),
              ),
            );

            const competitions = yield* gameday.fetchCompetitions({
              seasonId: selectedSeason.seasonId,
            });
            yield* gamedayRepo.upsertCompetitions(
              competitions.map(
                (competition) =>
                  new UpsertSyncedGamedayCompetitionInput({
                    sourceId,
                    seasonId: selectedSeason.seasonId,
                    compId: competition.compId,
                    name: competition.name,
                  }),
              ),
            );

            const competitionMatches = yield* Effect.forEach(
              competitions,
              (competition) =>
                Effect.map(
                  gameday.fetchFixtures(competition.compId),
                  (matches) => ({
                    competition,
                    matches,
                  }),
                ),
              { concurrency: 4 },
            );

            const teamsByKey = new Map<
              string,
              typeof UpsertSyncedGamedayTeamInput.Type
            >();
            for (const { competition, matches } of competitionMatches) {
              for (const team of gamedayTeamsFromMatches(matches)) {
                teamsByKey.set(
                  `${competition.compId}:${team.teamId}`,
                  new UpsertSyncedGamedayTeamInput({
                    sourceId,
                    seasonId: selectedSeason.seasonId,
                    compId: competition.compId,
                    teamId: team.teamId,
                    name: team.name,
                  }),
                );
              }
            }
            const teamRows = [...teamsByKey.values()];
            const teamsSynced = yield* gamedayRepo.upsertTeams(teamRows);

            const fixtureRows = competitionMatches.flatMap(
              ({ competition, matches }) =>
                matches
                  .filter((match) => match.isBye !== 1)
                  .map((match) =>
                    toSyncedGamedayFixture({
                      sourceId,
                      seasonId: selectedSeason.seasonId,
                      compId: competition.compId,
                      match,
                    }),
                  ),
            );
            const fixturesSynced =
              yield* gamedayRepo.upsertFixtures(fixtureRows);

            let playersSynced = 0;
            let rosterEntriesSynced = 0;
            if (decoded.includeRosters === true) {
              const rosters = yield* Effect.forEach(
                teamRows,
                (team) =>
                  gameday
                    .fetchRoster({ compId: team.compId, teamId: team.teamId })
                    .pipe(Effect.map((players) => ({ team, players }))),
                { concurrency: 2 },
              );

              const playersById = new Map<
                string,
                typeof UpsertSyncedGamedayPlayerInput.Type
              >();
              const rosterRows: (typeof UpsertSyncedGamedayRosterEntryInput.Type)[] =
                [];
              for (const roster of rosters) {
                for (const player of roster.players) {
                  playersById.set(
                    player.playerId,
                    new UpsertSyncedGamedayPlayerInput({
                      sourceId,
                      playerId: player.playerId,
                      name: player.name,
                    }),
                  );
                  rosterRows.push(
                    new UpsertSyncedGamedayRosterEntryInput({
                      sourceId,
                      seasonId: selectedSeason.seasonId,
                      compId: roster.team.compId,
                      teamId: roster.team.teamId,
                      playerId: player.playerId,
                      playerName: player.name,
                      gamesPlayed: player.gamesPlayed,
                      totalAssists: player.totalAssists,
                      totalScore: player.totalScore,
                    }),
                  );
                }
              }
              playersSynced = yield* gamedayRepo.upsertPlayers([
                ...playersById.values(),
              ]);
              rosterEntriesSynced =
                yield* gamedayRepo.upsertRosterEntries(rosterRows);
            }

            return new SyncGamedayAssociationSeasonResult({
              sourceId,
              sourceName: LACROSSE_VICTORIA_GAMEDAY_SOURCE_NAME,
              seasonId: selectedSeason.seasonId,
              seasonName: selectedSeason.name,
              competitions: competitions.length,
              teams: teamsSynced,
              fixtures: fixturesSynced,
              players: playersSynced,
              rosterEntries: rosterEntriesSynced,
            });
          }).pipe(
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tap((result) =>
              Effect.log(
                `Synced ${result.sourceName} ${result.seasonName}: ${result.competitions} comps, ${result.teams} teams, ${result.fixtures} fixtures`,
              ),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to sync GameDay association season", e),
            ),
          ),

        importGamedayTeams: (
          input: SchemaInput<typeof ImportGamedayTeamsInput>,
        ) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              ImportGamedayTeamsInput,
              input,
            );
            const sourceId = LACROSSE_VICTORIA_GAMEDAY_SOURCE_ID;

            yield* gamedayRepo.upsertSource(
              new UpsertGamedaySourceInput({
                id: sourceId,
                name: LACROSSE_VICTORIA_GAMEDAY_SOURCE_NAME,
                clientId: LACROSSE_VICTORIA_CLIENT,
                baseUrl: GAMEDAY_BASE_URL,
              }),
            );

            let links = 0;
            let fixtures = 0;
            let rosterPlayers = 0;
            let rosterLinks = 0;

            for (const selection of decoded.teams) {
              yield* gamedayRepo.upsertCompetitions([
                new UpsertSyncedGamedayCompetitionInput({
                  sourceId,
                  seasonId: decoded.seasonId,
                  compId: selection.compId,
                  name: selection.compName,
                }),
              ]);
              yield* gamedayRepo.upsertTeams([
                new UpsertSyncedGamedayTeamInput({
                  sourceId,
                  seasonId: decoded.seasonId,
                  compId: selection.compId,
                  teamId: selection.teamId,
                  name: selection.teamName,
                }),
              ]);

              const existingLink =
                yield* gamedayRepo.getClubTeamLinkForExternal({
                  organizationId: decoded.organizationId,
                  sourceId,
                  seasonId: decoded.seasonId,
                  compId: selection.compId,
                  gamedayTeamId: selection.teamId,
                });
              const legacyLink =
                existingLink.length === 0
                  ? yield* gamedayRepo.getLegacyClubTeamLinkForExternal({
                      organizationId: decoded.organizationId,
                      sourceId,
                      compId: selection.compId,
                      gamedayTeamId: selection.teamId,
                    })
                  : [];
              const reusableLink = existingLink[0] ?? legacyLink[0];
              const linkedTeam = reusableLink
                ? yield* clubRepo.getTeam({
                    organizationId: decoded.organizationId,
                    id: reusableLink.clubTeamId,
                  })
                : undefined;
              const importedTeamName = localTeamName(selection);
              const existingLocalTeam = linkedTeam
                ? undefined
                : (yield* clubRepo.listTeams({
                    organizationId: decoded.organizationId,
                  })).find(
                    (candidate) =>
                      normalizeName(candidate.name) ===
                      normalizeName(importedTeamName),
                  );
              const team =
                linkedTeam ??
                existingLocalTeam ??
                (yield* clubRepo.createTeam({
                  organizationId: decoded.organizationId,
                  name: importedTeamName,
                }));

              yield* gamedayRepo.upsertClubTeamLink(
                new UpsertClubTeamGamedayLinkInput({
                  organizationId: decoded.organizationId,
                  clubTeamId: team.id,
                  sourceId,
                  seasonId: decoded.seasonId,
                  compId: selection.compId,
                  gamedayTeamId: selection.teamId,
                }),
              );
              if (legacyLink[0] !== undefined) {
                yield* gamedayRepo.deleteClubTeamLink(legacyLink[0].id);
              }
              links += 1;

              let syncedFixtures =
                yield* gamedayRepo.listFixturesForClubTeamLink({
                  sourceId,
                  seasonId: decoded.seasonId,
                  compId: selection.compId,
                  gamedayTeamId: selection.teamId,
                });
              if (syncedFixtures.length === 0) {
                const matches = yield* gameday.fetchFixtures(selection.compId);
                yield* gamedayRepo.upsertFixtures(
                  matches
                    .filter((match) => match.isBye !== 1)
                    .map((match) =>
                      toSyncedGamedayFixture({
                        sourceId,
                        seasonId: decoded.seasonId,
                        compId: selection.compId,
                        match,
                      }),
                    ),
                );
                syncedFixtures = yield* gamedayRepo.listFixturesForClubTeamLink(
                  {
                    sourceId,
                    seasonId: decoded.seasonId,
                    compId: selection.compId,
                    gamedayTeamId: selection.teamId,
                  },
                );
              }
              fixtures += yield* repo.upsertFixtures(
                syncedFixtures.map((fixture) =>
                  toProjectedFixture({
                    team,
                    link: { gamedayTeamId: selection.teamId },
                    fixture,
                  }),
                ),
              );

              const fetchedRoster = yield* gameday.fetchRoster({
                compId: selection.compId,
                teamId: selection.teamId,
              });
              if (fetchedRoster.length > 0) {
                yield* gamedayRepo.upsertPlayers(
                  fetchedRoster.map(
                    (player) =>
                      new UpsertSyncedGamedayPlayerInput({
                        sourceId,
                        playerId: player.playerId,
                        name: player.name,
                      }),
                  ),
                );
                yield* gamedayRepo.upsertRosterEntries(
                  fetchedRoster.map(
                    (player) =>
                      new UpsertSyncedGamedayRosterEntryInput({
                        sourceId,
                        seasonId: decoded.seasonId,
                        compId: selection.compId,
                        teamId: selection.teamId,
                        playerId: player.playerId,
                        playerName: player.name,
                        gamesPlayed: player.gamesPlayed,
                        totalAssists: player.totalAssists,
                        totalScore: player.totalScore,
                      }),
                  ),
                );
              }

              const rosterEntries =
                yield* gamedayRepo.listRosterEntriesForClubTeamLink({
                  sourceId,
                  seasonId: decoded.seasonId,
                  compId: selection.compId,
                  gamedayTeamId: selection.teamId,
                });
              const localRoster = yield* clubRepo.listRoster({
                organizationId: decoded.organizationId,
                teamId: team.id,
              });
              const localByName = new Map(
                localRoster.map((player) => [
                  normalizeName(player.name),
                  player,
                ]),
              );
              const externalNameCounts = new Map<string, number>();
              for (const entry of rosterEntries) {
                const name = normalizeName(entry.playerName);
                externalNameCounts.set(
                  name,
                  (externalNameCounts.get(name) ?? 0) + 1,
                );
              }

              for (const entry of rosterEntries) {
                const existingPlayerLink =
                  yield* gamedayRepo.getRosterPlayerLinkForExternal({
                    organizationId: decoded.organizationId,
                    sourceId,
                    seasonId: decoded.seasonId,
                    compId: selection.compId,
                    gamedayTeamId: selection.teamId,
                    gamedayPlayerId: entry.playerId,
                  });
                if (existingPlayerLink.length > 0) continue;

                const normalizedEntryName = normalizeName(entry.playerName);
                const uniquelyNamedLocalPlayer =
                  externalNameCounts.get(normalizedEntryName) === 1
                    ? localByName.get(normalizedEntryName)
                    : undefined;
                const localPlayer =
                  uniquelyNamedLocalPlayer ??
                  (yield* clubRepo.addRosterPlayer({
                    organizationId: decoded.organizationId,
                    teamId: team.id,
                    name: entry.playerName,
                    jerseyNumber: null,
                  }));
                if (!localByName.has(normalizeName(localPlayer.name))) {
                  localByName.set(normalizeName(localPlayer.name), localPlayer);
                  rosterPlayers += 1;
                }
                yield* gamedayRepo.upsertRosterPlayerLink(
                  new UpsertRosterPlayerGamedayLinkInput({
                    organizationId: decoded.organizationId,
                    rosterPlayerId: localPlayer.id,
                    sourceId,
                    seasonId: decoded.seasonId,
                    compId: selection.compId,
                    gamedayTeamId: selection.teamId,
                    gamedayPlayerId: entry.playerId,
                  }),
                );
                rosterLinks += 1;
              }
            }

            return new ImportGamedayTeamsResult({
              teams: decoded.teams.length,
              links,
              fixtures,
              rosterPlayers,
              rosterLinks,
            });
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("ClubTeam", "gameday-link")),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tap((result) =>
              Effect.log(
                `Imported ${result.teams} GameDay teams, projected ${result.fixtures} fixtures, added ${result.rosterPlayers} roster players`,
              ),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to import GameDay teams", e),
            ),
          ),

        listCompetitions: (options?: {
          readonly seasonId?: string | undefined;
        }) =>
          gameday
            .fetchCompetitions(options)
            .pipe(
              Effect.tapError((e) =>
                Effect.logError("Failed to list GameDay competitions", e),
              ),
            ),

        listGamedayTeams: (input: { readonly compId: string }) =>
          gameday
            .fetchTeams(input.compId)
            .pipe(
              Effect.tapError((e) =>
                Effect.logError("Failed to list GameDay teams", e),
              ),
            ),

        listGamedaySeasons: () =>
          gameday
            .fetchSeasons()
            .pipe(
              Effect.tapError((e) =>
                Effect.logError("Failed to list GameDay seasons", e),
              ),
            ),

        listGamedayClubs: (input?: {
          readonly seasonId?: string | undefined;
        }) =>
          gameday
            .fetchClubs(input)
            .pipe(
              Effect.tapError((e) =>
                Effect.logError("Failed to list GameDay clubs", e),
              ),
            ),

        listCompetitionsForClubs: (input: {
          readonly clubNames: readonly string[];
          readonly seasonId?: string | undefined;
        }) =>
          Effect.gen(function* () {
            const sourceId = LACROSSE_VICTORIA_GAMEDAY_SOURCE_ID;
            if (input.seasonId !== undefined) {
              const syncedTeams = yield* gamedayRepo.listTeams({
                sourceId,
                seasonId: input.seasonId,
              });
              if (syncedTeams.length > 0) {
                const selectedNames = new Set(input.clubNames);
                const competitions = yield* gamedayRepo.listCompetitions({
                  sourceId,
                  seasonId: input.seasonId,
                });
                const competitionsById = new Map(
                  competitions.map((competition) => [
                    competition.compId,
                    competition,
                  ]),
                );
                return syncedTeams
                  .filter((team) => selectedNames.has(team.name))
                  .map(
                    (team) =>
                      new GamedayTeamCompetition({
                        compId: team.compId,
                        compName:
                          competitionsById.get(team.compId)?.name ??
                          team.compId,
                        teamId: team.teamId,
                        teamName: team.name,
                      }),
                  );
              }
            }
            return yield* gameday.fetchCompetitionsForClubs(input);
          }).pipe(
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError(
                "Failed to list GameDay competitions for clubs",
                e,
              ),
            ),
          ),

        listReports: (input: SchemaInput<typeof ListReportsInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(ListReportsInput, input);
            return yield* repo.listReports(decoded);
          }).pipe(
            Effect.map((rows) => rows.map(asReport)),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to list match reports", e),
            ),
          ),

        listMatchImages: (input: SchemaInput<typeof ListMatchImagesInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(ListMatchImagesInput, input);
            return yield* repo.listMatchImages(decoded);
          }).pipe(
            Effect.map((rows) => rows.map(asImage)),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to list match images", e),
            ),
          ),

        getMatchImage: (input: SchemaInput<typeof GetMatchImageInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetMatchImageInput, input);
            return yield* repo.getMatchImage(decoded);
          }).pipe(
            Effect.map(asImage),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MatchImage", input.id)),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to get match image", e),
            ),
          ),

        createMatchImage: (input: SchemaInput<typeof CreateMatchImageInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              CreateMatchImageInput,
              input,
            );
            const fixture = yield* repo
              .getFixture({
                organizationId: decoded.organizationId,
                id: decoded.fixtureId,
              })
              .pipe(
                Effect.catchTag("NoSuchElementError", () =>
                  Effect.fail(notFound("Fixture", decoded.fixtureId)),
                ),
              );
            const id = nanoid();
            const objectKey = [
              "match-images",
              decoded.organizationId,
              fixture.id,
              `${id}-${safeFileName(decoded.fileName)}`,
            ].join("/");
            return yield* repo.createMatchImage({
              id,
              organizationId: decoded.organizationId,
              fixtureId: fixture.id,
              uploadedByUserId: decoded.uploadedByUserId ?? null,
              objectKey,
              fileName: decoded.fileName,
              contentType: decoded.contentType,
              sizeBytes: decoded.sizeBytes,
            });
          }).pipe(
            Effect.map(asImage),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MatchImage", "create")),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to create match image", e),
            ),
          ),

        deleteMatchImage: (input: SchemaInput<typeof DeleteMatchImageInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              DeleteMatchImageInput,
              input,
            );
            return yield* repo.deleteMatchImage(decoded);
          }).pipe(
            Effect.map(asImage),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MatchImage", input.id)),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to delete match image", e),
            ),
          ),

        submitReport: (input: SchemaInput<typeof SubmitReportInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(SubmitReportInput, input);

            const fixture = yield* repo
              .getFixture({
                organizationId: decoded.organizationId,
                id: decoded.fixtureId,
              })
              .pipe(
                Effect.catchTag("NoSuchElementError", () =>
                  Effect.fail(notFound("Fixture", decoded.fixtureId)),
                ),
              );

            const team = yield* clubRepo
              .getTeam({
                organizationId: decoded.organizationId,
                id: fixture.teamId,
              })
              .pipe(
                Effect.catchTag("NoSuchElementError", () =>
                  Effect.fail(notFound("ClubTeam", fixture.teamId)),
                ),
              );

            const playerIds = [
              decoded.topPlayer1Id,
              decoded.topPlayer2Id ?? null,
              decoded.topPlayer3Id ?? null,
            ].filter((id): id is string => id !== null);

            if (new Set(playerIds).size !== playerIds.length) {
              return yield* Effect.fail(
                new ValidationError({
                  domain: "MatchReport",
                  message: "Top players must be three different players",
                }),
              );
            }

            const players = yield* repo.getRosterPlayers({
              organizationId: decoded.organizationId,
              ids: playerIds,
            });
            const playersById = new Map(
              players.map((player) => [player.id, player]),
            );
            const topPlayers: RosterPlayer[] = [];
            for (const id of playerIds) {
              const player = playersById.get(id);
              if (player === undefined || player.teamId !== fixture.teamId) {
                return yield* Effect.fail(
                  new ValidationError({
                    domain: "MatchReport",
                    message: "Top players must come from the team roster",
                  }),
                );
              }
              topPlayers.push(player);
            }

            const blurb = decoded.blurb ?? null;
            const report = yield* repo
              .upsertReport({
                organizationId: decoded.organizationId,
                fixtureId: fixture.id,
                teamId: fixture.teamId,
                submittedByUserId: decoded.submittedByUserId ?? null,
                topPlayer1Id: decoded.topPlayer1Id,
                topPlayer2Id: decoded.topPlayer2Id ?? null,
                topPlayer3Id: decoded.topPlayer3Id ?? null,
                blurb,
              })
              .pipe(
                Effect.catchTag("NoSuchElementError", () =>
                  Effect.fail(notFound("MatchReport", decoded.fixtureId)),
                ),
              );

            const recipients = yield* repo.getRecipientsForTeam({
              organizationId: decoded.organizationId,
              teamId: fixture.teamId,
            });
            if (recipients.length === 0) return asReport(report);

            const message = buildReportEmail({
              team,
              fixture,
              topPlayers,
              blurb,
              submitterName: decoded.submitterName ?? null,
            });
            yield* email.send({
              to: recipients.map((recipient) => recipient.email),
              ...message,
            });

            const sent = yield* repo
              .markReportSent({
                id: report.id,
                sentTo: recipients.map((recipient) => recipient.email),
              })
              .pipe(
                Effect.catchTag("NoSuchElementError", () =>
                  Effect.fail(notFound("MatchReport", report.id)),
                ),
              );
            return asReport(sent);
          }).pipe(
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tap(() => Effect.log("Match report submitted")),
            Effect.tapError((e) =>
              Effect.logError("Failed to submit match report", e),
            ),
          ),
      };
    }),
  },
) {
  // EmailService is intentionally not provided here — the API layer supplies
  // it from the worker environment (see EmailLive in @laxdb/api layers).
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide([
      MatchRepo.layer,
      ClubRepo.layer,
      GamedayClient.layer,
      GamedayRepo.layer,
    ]),
  );
}
