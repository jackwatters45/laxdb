import {
  DrizzleService,
  headOrFail,
  query,
} from "@laxdb/core/drizzle/drizzle.service";
import { and, asc, desc, eq, getColumns } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { users } from "../auth/auth.sql";

import type { GameDayFixtureImport } from "./malvern.gameday";
import type {
  AssignMalvernCoachInput,
  CreateMalvernPlayerInput,
  CreateMalvernTeamInput,
  ListMalvernTeamsInput,
  ListTopThreeSubmissionsInput,
  SubmitTopThreeInput,
  SyncMalvernFixturesInput,
  TeamScopedInput,
  UpdateMalvernPlayerInput,
  UpdateMalvernTeamInput,
} from "./malvern.schema";
import {
  malvernFixtures,
  malvernPlayers,
  malvernTeamCoaches,
  malvernTeams,
  malvernTopThreeSubmissions,
} from "./malvern.sql";

export class MalvernRepo extends Context.Service<MalvernRepo>()("MalvernRepo", {
  make: Effect.gen(function* () {
    const db = yield* DrizzleService;

    const { id: _teamId, ...teamColumns } = getColumns(malvernTeams);
    const { id: _playerId, ...playerColumns } = getColumns(malvernPlayers);
    const { id: _fixtureId, ...fixtureColumns } = getColumns(malvernFixtures);
    const { id: _submissionId, ...submissionColumns } = getColumns(
      malvernTopThreeSubmissions,
    );
    const { id: _coachId, ...coachColumns } = getColumns(malvernTeamCoaches);

    const getTeam = (input: TeamScopedInput) =>
      query(
        db
          .select(teamColumns)
          .from(malvernTeams)
          .where(
            and(
              eq(malvernTeams.organizationId, input.organizationId),
              eq(malvernTeams.publicId, input.teamPublicId),
            ),
          ),
      ).pipe(Effect.flatMap(headOrFail));

    const getFixture = (input: {
      readonly organizationId: string;
      readonly fixturePublicId: string;
    }) =>
      query(
        db
          .select(fixtureColumns)
          .from(malvernFixtures)
          .where(
            and(
              eq(malvernFixtures.organizationId, input.organizationId),
              eq(malvernFixtures.publicId, input.fixturePublicId),
            ),
          ),
      ).pipe(Effect.flatMap(headOrFail));

    const getPlayer = (input: {
      readonly organizationId: string;
      readonly playerPublicId: string;
    }) =>
      query(
        db
          .select(playerColumns)
          .from(malvernPlayers)
          .where(
            and(
              eq(malvernPlayers.organizationId, input.organizationId),
              eq(malvernPlayers.publicId, input.playerPublicId),
            ),
          ),
      ).pipe(Effect.flatMap(headOrFail));

    const emailPreview = (input: {
      readonly fixtureOpponent: string;
      readonly fixtureRound: string;
      readonly players: readonly [string, string, string];
      readonly blurb: string | null;
    }) => {
      const subject = `Malvern top three vs ${input.fixtureOpponent} (${input.fixtureRound})`;
      const body = [
        `Top three players for ${input.fixtureRound} vs ${input.fixtureOpponent}:`,
        "",
        `1. ${input.players[0]}`,
        `2. ${input.players[1]}`,
        `3. ${input.players[2]}`,
        "",
        input.blurb === null || input.blurb.trim() === ""
          ? "No coach notes supplied."
          : input.blurb.trim(),
      ].join("\n");
      return { subject, body };
    };

    const upsertFixture = (
      input: SyncMalvernFixturesInput,
      fixture: GameDayFixtureImport,
      sourceUrl: string | null,
    ) =>
      Effect.gen(function* () {
        const existing =
          fixture.externalFixtureId === null
            ? null
            : yield* query(
                db
                  .select(fixtureColumns)
                  .from(malvernFixtures)
                  .where(
                    and(
                      eq(malvernFixtures.organizationId, input.organizationId),
                      eq(malvernFixtures.teamPublicId, input.teamPublicId),
                      eq(
                        malvernFixtures.externalFixtureId,
                        fixture.externalFixtureId,
                      ),
                    ),
                  ),
              ).pipe(Effect.map((rows) => rows[0] ?? null));

        if (existing === null) {
          return yield* query(
            db
              .insert(malvernFixtures)
              .values({
                organizationId: input.organizationId,
                teamPublicId: input.teamPublicId,
                externalFixtureId: fixture.externalFixtureId,
                roundLabel: fixture.roundLabel,
                startsAt: fixture.startsAt,
                venue: fixture.venue,
                opponent: fixture.opponent,
                homeAway: fixture.homeAway,
                malvernScore: fixture.malvernScore,
                opponentScore: fixture.opponentScore,
                sourceUrl,
              })
              .returning(fixtureColumns),
          ).pipe(Effect.flatMap(headOrFail));
        }

        return yield* query(
          db
            .update(malvernFixtures)
            .set({
              roundLabel: fixture.roundLabel,
              startsAt: fixture.startsAt,
              venue: fixture.venue,
              opponent: fixture.opponent,
              homeAway: fixture.homeAway,
              malvernScore: fixture.malvernScore,
              opponentScore: fixture.opponentScore,
              sourceUrl,
              updatedAt: new Date(),
            })
            .where(eq(malvernFixtures.publicId, existing.publicId))
            .returning(fixtureColumns),
        ).pipe(Effect.flatMap(headOrFail));
      });

    return {
      listTeams: (input: ListMalvernTeamsInput) => {
        if (input.includeAll === true || input.viewerUserId === undefined) {
          return query(
            db
              .select(teamColumns)
              .from(malvernTeams)
              .where(eq(malvernTeams.organizationId, input.organizationId))
              .orderBy(asc(malvernTeams.name)),
          );
        }

        return query(
          db
            .select(teamColumns)
            .from(malvernTeams)
            .innerJoin(
              malvernTeamCoaches,
              eq(malvernTeamCoaches.teamPublicId, malvernTeams.publicId),
            )
            .where(
              and(
                eq(malvernTeams.organizationId, input.organizationId),
                eq(malvernTeamCoaches.coachUserId, input.viewerUserId),
              ),
            )
            .orderBy(asc(malvernTeams.name)),
        );
      },

      getTeam,

      createTeam: (input: CreateMalvernTeamInput) =>
        query(
          db
            .insert(malvernTeams)
            .values({
              organizationId: input.organizationId,
              name: input.name,
              grade: input.grade ?? null,
              sourceUrl: input.sourceUrl ?? null,
              defaultRecipientEmails: [...(input.defaultRecipientEmails ?? [])],
            })
            .returning(teamColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      updateTeam: (input: UpdateMalvernTeamInput) =>
        query(
          db
            .update(malvernTeams)
            .set({
              ...(input.name !== undefined && { name: input.name }),
              ...(input.grade !== undefined && { grade: input.grade }),
              ...(input.sourceUrl !== undefined && {
                sourceUrl: input.sourceUrl,
              }),
              ...(input.defaultRecipientEmails !== undefined && {
                defaultRecipientEmails: [...input.defaultRecipientEmails],
              }),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(malvernTeams.organizationId, input.organizationId),
                eq(malvernTeams.publicId, input.teamPublicId),
              ),
            )
            .returning(teamColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      assignCoach: (input: AssignMalvernCoachInput) =>
        Effect.gen(function* () {
          yield* getTeam(input);
          return yield* query(
            db
              .insert(malvernTeamCoaches)
              .values({
                organizationId: input.organizationId,
                teamPublicId: input.teamPublicId,
                coachUserId: input.coachUserId,
              })
              .returning(coachColumns),
          ).pipe(Effect.flatMap(headOrFail));
        }),

      listCoaches: (input: TeamScopedInput) =>
        query(
          db
            .select({
              ...coachColumns,
              coachName: users.name,
              coachEmail: users.email,
            })
            .from(malvernTeamCoaches)
            .innerJoin(users, eq(malvernTeamCoaches.coachUserId, users.id))
            .where(
              and(
                eq(malvernTeamCoaches.organizationId, input.organizationId),
                eq(malvernTeamCoaches.teamPublicId, input.teamPublicId),
              ),
            )
            .orderBy(asc(users.name)),
        ),

      listPlayers: (input: TeamScopedInput) =>
        query(
          db
            .select(playerColumns)
            .from(malvernPlayers)
            .where(
              and(
                eq(malvernPlayers.organizationId, input.organizationId),
                eq(malvernPlayers.teamPublicId, input.teamPublicId),
              ),
            )
            .orderBy(asc(malvernPlayers.name)),
        ),

      createPlayer: (input: CreateMalvernPlayerInput) =>
        Effect.gen(function* () {
          yield* getTeam(input);
          return yield* query(
            db
              .insert(malvernPlayers)
              .values({
                organizationId: input.organizationId,
                teamPublicId: input.teamPublicId,
                name: input.name,
                jumperNumber: input.jumperNumber ?? null,
              })
              .returning(playerColumns),
          ).pipe(Effect.flatMap(headOrFail));
        }),

      updatePlayer: (input: UpdateMalvernPlayerInput) =>
        query(
          db
            .update(malvernPlayers)
            .set({
              ...(input.name !== undefined && { name: input.name }),
              ...(input.jumperNumber !== undefined && {
                jumperNumber: input.jumperNumber,
              }),
              ...(input.active !== undefined && { active: input.active }),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(malvernPlayers.organizationId, input.organizationId),
                eq(malvernPlayers.publicId, input.publicId),
              ),
            )
            .returning(playerColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      listFixtures: (input: TeamScopedInput) =>
        query(
          db
            .select(fixtureColumns)
            .from(malvernFixtures)
            .where(
              and(
                eq(malvernFixtures.organizationId, input.organizationId),
                eq(malvernFixtures.teamPublicId, input.teamPublicId),
              ),
            )
            .orderBy(asc(malvernFixtures.startsAt)),
        ),

      importFixtures: (
        input: SyncMalvernFixturesInput,
        fixtures: readonly GameDayFixtureImport[],
        sourceUrl: string | null,
      ) =>
        Effect.forEach(fixtures, (fixture) =>
          upsertFixture(input, fixture, sourceUrl),
        ),

      submitTopThree: (input: SubmitTopThreeInput) =>
        Effect.gen(function* () {
          const fixture = yield* getFixture({
            organizationId: input.organizationId,
            fixturePublicId: input.fixturePublicId,
          });
          const first = yield* getPlayer({
            organizationId: input.organizationId,
            playerPublicId: input.firstPlayerPublicId,
          });
          const second = yield* getPlayer({
            organizationId: input.organizationId,
            playerPublicId: input.secondPlayerPublicId,
          });
          const third = yield* getPlayer({
            organizationId: input.organizationId,
            playerPublicId: input.thirdPlayerPublicId,
          });
          const preview = emailPreview({
            fixtureOpponent: fixture.opponent,
            fixtureRound: fixture.roundLabel,
            players: [first.name, second.name, third.name],
            blurb: input.blurb ?? null,
          });

          return yield* query(
            db
              .insert(malvernTopThreeSubmissions)
              .values({
                organizationId: input.organizationId,
                fixturePublicId: input.fixturePublicId,
                submittedByUserId: input.submittedByUserId,
                firstPlayerPublicId: input.firstPlayerPublicId,
                secondPlayerPublicId: input.secondPlayerPublicId,
                thirdPlayerPublicId: input.thirdPlayerPublicId,
                blurb: input.blurb ?? null,
                recipientEmails: [...input.recipientEmails],
                emailSubject: preview.subject,
                emailBody: preview.body,
                emailedAt: null,
              })
              .returning(submissionColumns),
          ).pipe(Effect.flatMap(headOrFail));
        }),

      listSubmissions: (input: ListTopThreeSubmissionsInput) => {
        if (input.teamPublicId === undefined) {
          return query(
            db
              .select(submissionColumns)
              .from(malvernTopThreeSubmissions)
              .where(
                eq(
                  malvernTopThreeSubmissions.organizationId,
                  input.organizationId,
                ),
              )
              .orderBy(desc(malvernTopThreeSubmissions.createdAt)),
          );
        }

        return query(
          db
            .select(submissionColumns)
            .from(malvernTopThreeSubmissions)
            .innerJoin(
              malvernFixtures,
              eq(
                malvernTopThreeSubmissions.fixturePublicId,
                malvernFixtures.publicId,
              ),
            )
            .where(
              and(
                eq(
                  malvernTopThreeSubmissions.organizationId,
                  input.organizationId,
                ),
                eq(malvernFixtures.teamPublicId, input.teamPublicId),
              ),
            )
            .orderBy(desc(malvernTopThreeSubmissions.createdAt)),
        );
      },
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
