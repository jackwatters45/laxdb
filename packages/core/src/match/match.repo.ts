import {
  DrizzleService,
  headOrFail,
  query,
} from "@laxdb/core/drizzle/drizzle.service";
import {
  and,
  asc,
  desc,
  eq,
  getColumns,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { nanoid } from "nanoid";

import { reportRecipients, rosterPlayers } from "../club/club.sql";

import type {
  FixtureByIdInput,
  GetMatchImageInput,
  ListFixturesInput,
  ListMatchImagesInput,
  ListReportsInput,
} from "./match.schema";
import {
  fixtures,
  matchImages,
  matchReports,
  type NewFixture,
} from "./match.sql";

export type UpsertFixture = Omit<NewFixture, "id" | "createdAt" | "updatedAt">;

export type CreateMatchImage = {
  readonly id: string;
  readonly organizationId: string;
  readonly fixtureId: string;
  readonly uploadedByUserId: string | null;
  readonly objectKey: string;
  readonly fileName: string;
  readonly contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  readonly sizeBytes: number;
};

export type UpsertReport = {
  readonly organizationId: string;
  readonly fixtureId: string;
  readonly teamId: string;
  readonly submittedByUserId: string | null;
  readonly topPlayer1Id: string;
  readonly topPlayer2Id: string | null;
  readonly topPlayer3Id: string | null;
  readonly blurb: string | null;
};

export class MatchRepo extends Context.Service<MatchRepo>()("MatchRepo", {
  make: Effect.gen(function* () {
    const db = yield* DrizzleService;

    const fixtureColumns = getColumns(fixtures);
    const reportColumns = getColumns(matchReports);
    const imageColumns = getColumns(matchImages);
    const playerColumns = getColumns(rosterPlayers);
    const recipientColumns = getColumns(reportRecipients);

    return {
      listFixtures: (input: ListFixturesInput) =>
        query(
          db
            .select(fixtureColumns)
            .from(fixtures)
            .where(
              input.teamId === undefined
                ? eq(fixtures.organizationId, input.organizationId)
                : and(
                    eq(fixtures.organizationId, input.organizationId),
                    eq(fixtures.teamId, input.teamId),
                  ),
            )
            .orderBy(desc(fixtures.scheduledAt)),
        ),

      getFixture: (input: FixtureByIdInput) =>
        query(
          db
            .select(fixtureColumns)
            .from(fixtures)
            .where(
              and(
                eq(fixtures.organizationId, input.organizationId),
                eq(fixtures.id, input.id),
              ),
            ),
        ).pipe(Effect.flatMap(headOrFail)),

      upsertFixtures: (rows: readonly UpsertFixture[]) =>
        Effect.gen(function* () {
          const now = new Date();
          yield* Effect.forEach(
            rows,
            (row) =>
              query(
                db
                  .insert(fixtures)
                  .values({ ...row, id: nanoid(), createdAt: now })
                  .onConflictDoUpdate({
                    target: [fixtures.teamId, fixtures.gamedayFixtureId],
                    set: {
                      sourceId: row.sourceId,
                      seasonId: row.seasonId,
                      compId: row.compId,
                      compName: row.compName,
                      round: row.round,
                      scheduledAt: row.scheduledAt,
                      homeTeamName: row.homeTeamName,
                      awayTeamName: row.awayTeamName,
                      isHome: row.isHome,
                      venueName: row.venueName,
                      matchStatus: row.matchStatus,
                      homeScore: row.homeScore,
                      awayScore: row.awayScore,
                      updatedAt: now,
                    },
                  }),
              ),
            { discard: true },
          );
          return rows.length;
        }),

      listReports: (input: ListReportsInput) =>
        query(
          db
            .select(reportColumns)
            .from(matchReports)
            .where(
              input.teamId === undefined
                ? eq(matchReports.organizationId, input.organizationId)
                : and(
                    eq(matchReports.organizationId, input.organizationId),
                    eq(matchReports.teamId, input.teamId),
                  ),
            )
            .orderBy(desc(matchReports.createdAt)),
        ),

      listMatchImages: (input: ListMatchImagesInput) =>
        query(
          input.teamId === undefined
            ? db
                .select(imageColumns)
                .from(matchImages)
                .where(
                  input.fixtureId === undefined
                    ? eq(matchImages.organizationId, input.organizationId)
                    : and(
                        eq(matchImages.organizationId, input.organizationId),
                        eq(matchImages.fixtureId, input.fixtureId),
                      ),
                )
                .orderBy(asc(matchImages.createdAt))
            : db
                .select(imageColumns)
                .from(matchImages)
                .innerJoin(fixtures, eq(fixtures.id, matchImages.fixtureId))
                .where(
                  and(
                    eq(matchImages.organizationId, input.organizationId),
                    eq(fixtures.organizationId, input.organizationId),
                    eq(fixtures.teamId, input.teamId),
                  ),
                )
                .orderBy(asc(matchImages.createdAt)),
        ),

      getMatchImage: (input: GetMatchImageInput) =>
        query(
          db
            .select(imageColumns)
            .from(matchImages)
            .where(
              and(
                eq(matchImages.organizationId, input.organizationId),
                eq(matchImages.id, input.id),
              ),
            ),
        ).pipe(Effect.flatMap(headOrFail)),

      createMatchImage: (input: CreateMatchImage) =>
        query(
          db
            .insert(matchImages)
            .values({ ...input, createdAt: new Date() })
            .returning(imageColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      deleteMatchImage: (input: GetMatchImageInput) =>
        query(
          db
            .delete(matchImages)
            .where(
              and(
                eq(matchImages.organizationId, input.organizationId),
                eq(matchImages.id, input.id),
              ),
            )
            .returning(imageColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      upsertReport: (input: UpsertReport) =>
        query(
          db
            .insert(matchReports)
            .values({
              ...input,
              id: nanoid(),
              sentTo: [],
              sentAt: null,
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: matchReports.fixtureId,
              set: {
                submittedByUserId: input.submittedByUserId,
                topPlayer1Id: input.topPlayer1Id,
                topPlayer2Id: input.topPlayer2Id,
                topPlayer3Id: input.topPlayer3Id,
                blurb: input.blurb,
                updatedAt: new Date(),
              },
            })
            .returning(reportColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      markReportSent: (input: {
        readonly id: string;
        readonly sentTo: readonly string[];
      }) =>
        query(
          db
            .update(matchReports)
            .set({ sentTo: input.sentTo, sentAt: new Date() })
            .where(eq(matchReports.id, input.id))
            .returning(reportColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      getRosterPlayers: (input: {
        readonly organizationId: string;
        readonly ids: readonly string[];
      }) =>
        input.ids.length === 0
          ? Effect.succeed([])
          : query(
              db
                .select(playerColumns)
                .from(rosterPlayers)
                .where(
                  and(
                    eq(rosterPlayers.organizationId, input.organizationId),
                    inArray(rosterPlayers.id, [...input.ids]),
                  ),
                ),
            ),

      getRecipientsForTeam: (input: {
        readonly organizationId: string;
        readonly teamId: string;
      }) =>
        query(
          db
            .select(recipientColumns)
            .from(reportRecipients)
            .where(
              and(
                eq(reportRecipients.organizationId, input.organizationId),
                or(
                  eq(reportRecipients.teamId, input.teamId),
                  isNull(reportRecipients.teamId),
                ),
              ),
            ),
        ),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
