import { ClubRepo } from "@laxdb/core/club/club.repo";
import type { ClubTeam, RosterPlayer } from "@laxdb/core/club/club.sql";
import { EmailService } from "@laxdb/core/email/email.service";
import { NotFoundError, ValidationError } from "@laxdb/core/error";
import {
  decodeArguments,
  parseSqlError,
  type SchemaInput,
} from "@laxdb/core/util";
import { Context, Effect, Layer } from "effect";

import {
  GamedayClient,
  gamedayDate,
  gamedayMatchName,
  gamedayScore,
  type GamedayMatch,
} from "./gameday";
import { MatchRepo, type UpsertFixture } from "./match.repo";
import {
  Fixture,
  FixtureByIdInput,
  ListFixturesInput,
  ListReportsInput,
  MatchReport,
  SubmitReportInput,
  SyncFixturesInput,
  SyncFixturesResult,
} from "./match.schema";
import type { Fixture as FixtureRow } from "./match.sql";

const asFixture = (row: typeof Fixture.Type) => new Fixture(row);
const asReport = (row: typeof MatchReport.Type) => new MatchReport(row);

const notFound = (domain: string, id: string | number) =>
  new NotFoundError({ domain, id });

const involvesTeam = (
  team: { readonly name: string; readonly gamedayTeamId: string | null },
  match: GamedayMatch,
) => {
  if (team.gamedayTeamId !== null) {
    return (
      match.HomeID === team.gamedayTeamId || match.AwayID === team.gamedayTeamId
    );
  }
  const needle = team.name.toLowerCase();
  return (
    gamedayMatchName(match, "home").toLowerCase().includes(needle) ||
    gamedayMatchName(match, "away").toLowerCase().includes(needle)
  );
};

const isHomeFor = (
  team: { readonly name: string; readonly gamedayTeamId: string | null },
  match: GamedayMatch,
) =>
  team.gamedayTeamId !== null
    ? match.HomeID === team.gamedayTeamId
    : gamedayMatchName(match, "home")
        .toLowerCase()
        .includes(team.name.toLowerCase());

const toUpsertFixture = (
  team: ClubTeam,
  compId: string,
  match: GamedayMatch,
): UpsertFixture => ({
  organizationId: team.organizationId,
  teamId: team.id,
  gamedayFixtureId: match.FixtureID,
  compId,
  compName: match.CompName?.trim() ?? null,
  round: match.Round ?? null,
  scheduledAt: gamedayDate(match.TimeDateRaw),
  homeTeamName: gamedayMatchName(match, "home"),
  awayTeamName: gamedayMatchName(match, "away"),
  isHome: isHomeFor(team, match),
  venueName: match.VenueName ?? null,
  matchStatus: match.MatchStatus ?? null,
  homeScore: gamedayScore(match.HomeScore),
  awayScore: gamedayScore(match.AwayScore),
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

            const compId = team.gamedayCompId;
            if (compId === null) {
              return yield* Effect.fail(
                new ValidationError({
                  domain: "Fixture",
                  message:
                    "Team has no GameDay competition id configured — set it in admin before syncing",
                }),
              );
            }

            const matches = yield* gameday.fetchFixtures(compId);
            const relevant = matches.filter(
              (match) => match.isBye !== 1 && involvesTeam(team, match),
            );
            const synced = yield* repo.upsertFixtures(
              relevant.map((match) => toUpsertFixture(team, compId, match)),
            );

            return new SyncFixturesResult({
              synced,
              compName: relevant[0]?.CompName?.trim() ?? null,
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

            const recipients = yield* repo.getRecipients({
              organizationId: decoded.organizationId,
              ids: decoded.recipientIds,
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
    Layer.provide([MatchRepo.layer, ClubRepo.layer, GamedayClient.layer]),
  );
}
