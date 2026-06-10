import {
  DrizzleService,
  headOrFail,
  query,
} from "@laxdb/core/drizzle/drizzle.service";
import { and, asc, eq, getColumns, isNull, or } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { nanoid } from "nanoid";

import type {
  AddRecipientInput,
  AddRosterPlayerInput,
  ClubOrganizationScopedInput,
  CreateTeamInput,
  RecipientByIdInput,
  RosterPlayerByIdInput,
  TeamByIdInput,
  TeamScopedInput,
  UpdateRosterPlayerInput,
  UpdateTeamInput,
} from "./club.schema";
import { clubTeams, reportRecipients, rosterPlayers } from "./club.sql";

export class ClubRepo extends Context.Service<ClubRepo>()("ClubRepo", {
  make: Effect.gen(function* () {
    const db = yield* DrizzleService;

    const teamColumns = getColumns(clubTeams);
    const playerColumns = getColumns(rosterPlayers);
    const recipientColumns = getColumns(reportRecipients);

    return {
      listTeams: (input: ClubOrganizationScopedInput) =>
        query(
          db
            .select(teamColumns)
            .from(clubTeams)
            .where(eq(clubTeams.organizationId, input.organizationId))
            .orderBy(asc(clubTeams.name)),
        ),

      getTeam: (input: TeamByIdInput) =>
        query(
          db
            .select(teamColumns)
            .from(clubTeams)
            .where(
              and(
                eq(clubTeams.organizationId, input.organizationId),
                eq(clubTeams.id, input.id),
              ),
            ),
        ).pipe(Effect.flatMap(headOrFail)),

      createTeam: (input: CreateTeamInput) =>
        query(
          db
            .insert(clubTeams)
            .values({
              id: nanoid(),
              organizationId: input.organizationId,
              name: input.name,
              gamedayCompId: input.gamedayCompId ?? null,
              gamedayTeamId: input.gamedayTeamId ?? null,
              coachMemberId: input.coachMemberId ?? null,
              createdAt: new Date(),
            })
            .returning(teamColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      updateTeam: (input: UpdateTeamInput) =>
        query(
          db
            .update(clubTeams)
            .set({
              ...(input.name !== undefined && { name: input.name }),
              ...(input.gamedayCompId !== undefined && {
                gamedayCompId: input.gamedayCompId,
              }),
              ...(input.gamedayTeamId !== undefined && {
                gamedayTeamId: input.gamedayTeamId,
              }),
              ...(input.coachMemberId !== undefined && {
                coachMemberId: input.coachMemberId,
              }),
            })
            .where(
              and(
                eq(clubTeams.organizationId, input.organizationId),
                eq(clubTeams.id, input.id),
              ),
            )
            .returning(teamColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      deleteTeam: (input: TeamByIdInput) =>
        query(
          db
            .delete(clubTeams)
            .where(
              and(
                eq(clubTeams.organizationId, input.organizationId),
                eq(clubTeams.id, input.id),
              ),
            )
            .returning(teamColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      listRoster: (input: TeamScopedInput) =>
        query(
          db
            .select(playerColumns)
            .from(rosterPlayers)
            .where(
              and(
                eq(rosterPlayers.organizationId, input.organizationId),
                eq(rosterPlayers.teamId, input.teamId),
              ),
            )
            .orderBy(asc(rosterPlayers.name)),
        ),

      getRosterPlayer: (input: RosterPlayerByIdInput) =>
        query(
          db
            .select(playerColumns)
            .from(rosterPlayers)
            .where(
              and(
                eq(rosterPlayers.organizationId, input.organizationId),
                eq(rosterPlayers.id, input.id),
              ),
            ),
        ).pipe(Effect.flatMap(headOrFail)),

      addRosterPlayer: (input: AddRosterPlayerInput) =>
        query(
          db
            .insert(rosterPlayers)
            .values({
              id: nanoid(),
              organizationId: input.organizationId,
              teamId: input.teamId,
              name: input.name,
              jerseyNumber: input.jerseyNumber ?? null,
              active: true,
              createdAt: new Date(),
            })
            .returning(playerColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      updateRosterPlayer: (input: UpdateRosterPlayerInput) =>
        query(
          db
            .update(rosterPlayers)
            .set({
              ...(input.name !== undefined && { name: input.name }),
              ...(input.jerseyNumber !== undefined && {
                jerseyNumber: input.jerseyNumber,
              }),
              ...(input.active !== undefined && { active: input.active }),
            })
            .where(
              and(
                eq(rosterPlayers.organizationId, input.organizationId),
                eq(rosterPlayers.id, input.id),
              ),
            )
            .returning(playerColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      removeRosterPlayer: (input: RosterPlayerByIdInput) =>
        query(
          db
            .delete(rosterPlayers)
            .where(
              and(
                eq(rosterPlayers.organizationId, input.organizationId),
                eq(rosterPlayers.id, input.id),
              ),
            )
            .returning(playerColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      listRecipients: (input: ClubOrganizationScopedInput) =>
        query(
          db
            .select(recipientColumns)
            .from(reportRecipients)
            .where(eq(reportRecipients.organizationId, input.organizationId))
            .orderBy(asc(reportRecipients.label)),
        ),

      /** Recipients applicable to one team: team-specific plus org-wide. */
      listRecipientsForTeam: (input: TeamScopedInput) =>
        query(
          db
            .select(recipientColumns)
            .from(reportRecipients)
            .where(
              and(
                eq(reportRecipients.organizationId, input.organizationId),
                or(
                  isNull(reportRecipients.teamId),
                  eq(reportRecipients.teamId, input.teamId),
                ),
              ),
            )
            .orderBy(asc(reportRecipients.label)),
        ),

      addRecipient: (input: AddRecipientInput) =>
        query(
          db
            .insert(reportRecipients)
            .values({
              id: nanoid(),
              organizationId: input.organizationId,
              teamId: input.teamId ?? null,
              label: input.label,
              email: input.email,
              createdAt: new Date(),
            })
            .returning(recipientColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      removeRecipient: (input: RecipientByIdInput) =>
        query(
          db
            .delete(reportRecipients)
            .where(
              and(
                eq(reportRecipients.organizationId, input.organizationId),
                eq(reportRecipients.id, input.id),
              ),
            )
            .returning(recipientColumns),
        ).pipe(Effect.flatMap(headOrFail)),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
