import { NotFoundError, ValidationError } from "@laxdb/core/error";
import {
  decodeArguments,
  parseSqlError,
  type SchemaInput,
} from "@laxdb/core/util";
import { Context, Effect, Layer } from "effect";

import { ClubRepo } from "./club.repo";
import {
  AddRecipientInput,
  AddRosterPlayerInput,
  ClubOrganizationScopedInput,
  ClubTeam,
  CreateTeamInput,
  RecipientByIdInput,
  ReportRecipient,
  RosterPlayer,
  RosterPlayerByIdInput,
  TeamByIdInput,
  TeamScopedInput,
  UpdateRosterPlayerInput,
  UpdateTeamInput,
} from "./club.schema";

const asTeam = (row: typeof ClubTeam.Type) => new ClubTeam(row);
const asPlayer = (row: typeof RosterPlayer.Type) => new RosterPlayer(row);
const asRecipient = (row: typeof ReportRecipient.Type) =>
  new ReportRecipient(row);

const notFound = (domain: string, id: string | number) =>
  new NotFoundError({ domain, id });

const emptyUpdate = (domain: string) =>
  new ValidationError({ domain, message: "No fields to update" });

export class ClubService extends Context.Service<ClubService>()("ClubService", {
  make: Effect.gen(function* () {
    const repo = yield* ClubRepo;

    /** Fails with NotFoundError when the member is not part of the org. */
    const checkMember = (organizationId: string, memberId: string) =>
      repo
        .getMember({ organizationId, id: memberId })
        .pipe(
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("Member", memberId)),
          ),
        );

    /** Fails with NotFoundError when the team is not part of the org. */
    const checkTeam = (organizationId: string, teamId: string) =>
      repo
        .getTeam({ organizationId, id: teamId })
        .pipe(
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("ClubTeam", teamId)),
          ),
        );

    return {
      listTeams: (input: SchemaInput<typeof ClubOrganizationScopedInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            ClubOrganizationScopedInput,
            input,
          );
          return yield* repo.listTeams(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asTeam)),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to list teams", e)),
        ),

      getTeam: (input: SchemaInput<typeof TeamByIdInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(TeamByIdInput, input);
          return yield* repo.getTeam(decoded);
        }).pipe(
          Effect.map(asTeam),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("ClubTeam", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to get team", e)),
        ),

      createTeam: (input: SchemaInput<typeof CreateTeamInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(CreateTeamInput, input);
          if (decoded.coachMemberId != null) {
            yield* checkMember(decoded.organizationId, decoded.coachMemberId);
          }
          return yield* repo.createTeam(decoded);
        }).pipe(
          Effect.map(asTeam),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("ClubTeam", "create")),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to create team", e)),
        ),

      updateTeam: (input: SchemaInput<typeof UpdateTeamInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(UpdateTeamInput, input);
          if (
            decoded.name === undefined &&
            decoded.gamedayCompId === undefined &&
            decoded.gamedayTeamId === undefined &&
            decoded.coachMemberId === undefined
          ) {
            return yield* Effect.fail(emptyUpdate("ClubTeam"));
          }
          if (decoded.coachMemberId != null) {
            yield* checkMember(decoded.organizationId, decoded.coachMemberId);
          }
          return yield* repo.updateTeam(decoded);
        }).pipe(
          Effect.map(asTeam),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("ClubTeam", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to update team", e)),
        ),

      deleteTeam: (input: SchemaInput<typeof TeamByIdInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(TeamByIdInput, input);
          return yield* repo.deleteTeam(decoded);
        }).pipe(
          Effect.map(asTeam),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("ClubTeam", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to delete team", e)),
        ),

      listRoster: (input: SchemaInput<typeof TeamScopedInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(TeamScopedInput, input);
          return yield* repo.listRoster(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asPlayer)),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to list roster", e)),
        ),

      addRosterPlayer: (input: SchemaInput<typeof AddRosterPlayerInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(AddRosterPlayerInput, input);
          yield* checkTeam(decoded.organizationId, decoded.teamId);
          return yield* repo.addRosterPlayer(decoded);
        }).pipe(
          Effect.map(asPlayer),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("RosterPlayer", "create")),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to add roster player", e),
          ),
        ),

      updateRosterPlayer: (
        input: SchemaInput<typeof UpdateRosterPlayerInput>,
      ) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            UpdateRosterPlayerInput,
            input,
          );
          if (
            decoded.name === undefined &&
            decoded.jerseyNumber === undefined &&
            decoded.active === undefined
          ) {
            return yield* Effect.fail(emptyUpdate("RosterPlayer"));
          }
          return yield* repo.updateRosterPlayer(decoded);
        }).pipe(
          Effect.map(asPlayer),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("RosterPlayer", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to update roster player", e),
          ),
        ),

      removeRosterPlayer: (input: SchemaInput<typeof RosterPlayerByIdInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(RosterPlayerByIdInput, input);
          return yield* repo.removeRosterPlayer(decoded);
        }).pipe(
          Effect.map(asPlayer),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("RosterPlayer", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to remove roster player", e),
          ),
        ),

      listRecipients: (
        input: SchemaInput<typeof ClubOrganizationScopedInput>,
      ) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            ClubOrganizationScopedInput,
            input,
          );
          return yield* repo.listRecipients(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asRecipient)),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to list recipients", e),
          ),
        ),

      listRecipientsForTeam: (input: SchemaInput<typeof TeamScopedInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(TeamScopedInput, input);
          return yield* repo.listRecipientsForTeam(decoded);
        }).pipe(
          Effect.map((rows) => rows.map(asRecipient)),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to list team recipients", e),
          ),
        ),

      addRecipient: (input: SchemaInput<typeof AddRecipientInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(AddRecipientInput, input);
          if (decoded.teamId != null) {
            yield* checkTeam(decoded.organizationId, decoded.teamId);
          }
          return yield* repo.addRecipient(decoded);
        }).pipe(
          Effect.map(asRecipient),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("ReportRecipient", "create")),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) => Effect.logError("Failed to add recipient", e)),
        ),

      removeRecipient: (input: SchemaInput<typeof RecipientByIdInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(RecipientByIdInput, input);
          return yield* repo.removeRecipient(decoded);
        }).pipe(
          Effect.map(asRecipient),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(notFound("ReportRecipient", input.id)),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError((e) =>
            Effect.logError("Failed to remove recipient", e),
          ),
        ),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ClubRepo.layer),
  );
}
