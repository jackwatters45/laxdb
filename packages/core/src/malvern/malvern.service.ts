import { Context, Effect, Layer, Schema } from "effect";

import { NotFoundError, ValidationError } from "../error";
import { decodeArguments, parseSqlError, type SchemaInput } from "../util";

import { parseGameDayFixtures } from "./malvern.gameday";
import { MalvernRepo } from "./malvern.repo";
import {
  AssignMalvernCoachInput,
  CreateMalvernPlayerInput,
  CreateMalvernTeamInput,
  FixtureImportResult,
  ListMalvernTeamsInput,
  ListTopThreeSubmissionsInput,
  MalvernFixture,
  MalvernPlayer,
  MalvernTeam,
  MalvernTeamCoach,
  MalvernTopThreeSubmission,
  SubmitTopThreeInput,
  SyncMalvernFixturesInput,
  TeamScopedInput,
  UpdateMalvernPlayerInput,
  UpdateMalvernTeamInput,
} from "./malvern.schema";

const asTeam = Schema.decodeUnknownSync(MalvernTeam);
const asCoach = Schema.decodeUnknownSync(MalvernTeamCoach);
const asPlayer = Schema.decodeUnknownSync(MalvernPlayer);
const asFixture = Schema.decodeUnknownSync(MalvernFixture);
const asSubmission = Schema.decodeUnknownSync(MalvernTopThreeSubmission);
const asFixtureImportResult = Schema.decodeUnknownSync(FixtureImportResult);

const notFound = (domain: string, id: string) =>
  new NotFoundError({ domain, id, message: `${domain} not found` });

export class MalvernService extends Context.Service<MalvernService>()(
  "MalvernService",
  {
    make: Effect.gen(function* () {
      const repo = yield* MalvernRepo;

      return {
        listTeams: (input: SchemaInput<typeof ListMalvernTeamsInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              ListMalvernTeamsInput,
              input,
            );
            return yield* repo.listTeams(decoded);
          }).pipe(
            Effect.map((rows) => rows.map((row) => asTeam(row))),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to list Malvern teams", e),
            ),
          ),

        getTeam: (input: SchemaInput<typeof TeamScopedInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(TeamScopedInput, input);
            return yield* repo.getTeam(decoded);
          }).pipe(
            Effect.map(asTeam),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MalvernTeam", input.teamPublicId)),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to get Malvern team", e),
            ),
          ),

        createTeam: (input: SchemaInput<typeof CreateMalvernTeamInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              CreateMalvernTeamInput,
              input,
            );
            return yield* repo.createTeam(decoded);
          }).pipe(
            Effect.map(asTeam),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MalvernTeam", "create")),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to create Malvern team", e),
            ),
          ),

        updateTeam: (input: SchemaInput<typeof UpdateMalvernTeamInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              UpdateMalvernTeamInput,
              input,
            );
            return yield* repo.updateTeam(decoded);
          }).pipe(
            Effect.map(asTeam),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MalvernTeam", input.teamPublicId)),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to update Malvern team", e),
            ),
          ),

        assignCoach: (input: SchemaInput<typeof AssignMalvernCoachInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              AssignMalvernCoachInput,
              input,
            );
            yield* repo.assignCoach(decoded);
            const coaches = yield* repo.listCoaches(decoded);
            const coach = coaches.find(
              (candidate) => candidate.coachUserId === decoded.coachUserId,
            );
            if (coach === undefined) {
              return yield* Effect.fail(
                notFound("MalvernTeamCoach", decoded.coachUserId),
              );
            }
            return coach;
          }).pipe(
            Effect.map(asCoach),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MalvernTeam", input.teamPublicId)),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to assign Malvern coach", e),
            ),
          ),

        listCoaches: (input: SchemaInput<typeof TeamScopedInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(TeamScopedInput, input);
            return yield* repo.listCoaches(decoded);
          }).pipe(
            Effect.map((rows) => rows.map((row) => asCoach(row))),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to list Malvern coaches", e),
            ),
          ),

        listPlayers: (input: SchemaInput<typeof TeamScopedInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(TeamScopedInput, input);
            return yield* repo.listPlayers(decoded);
          }).pipe(
            Effect.map((rows) => rows.map((row) => asPlayer(row))),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to list Malvern players", e),
            ),
          ),

        createPlayer: (input: SchemaInput<typeof CreateMalvernPlayerInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              CreateMalvernPlayerInput,
              input,
            );
            return yield* repo.createPlayer(decoded);
          }).pipe(
            Effect.map(asPlayer),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MalvernTeam", input.teamPublicId)),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to create Malvern player", e),
            ),
          ),

        updatePlayer: (input: SchemaInput<typeof UpdateMalvernPlayerInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              UpdateMalvernPlayerInput,
              input,
            );
            return yield* repo.updatePlayer(decoded);
          }).pipe(
            Effect.map(asPlayer),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MalvernPlayer", input.publicId)),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to update Malvern player", e),
            ),
          ),

        listFixtures: (input: SchemaInput<typeof TeamScopedInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(TeamScopedInput, input);
            return yield* repo.listFixtures(decoded);
          }).pipe(
            Effect.map((rows) => rows.map((row) => asFixture(row))),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to list Malvern fixtures", e),
            ),
          ),

        importFixtures: (input: SchemaInput<typeof SyncMalvernFixturesInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              SyncMalvernFixturesInput,
              input,
            );
            const team = yield* repo.getTeam(decoded);
            const sourceUrl = decoded.sourceUrl ?? team.sourceUrl;
            const fixtures = parseGameDayFixtures(decoded.sourceText);
            if (fixtures.length === 0) {
              return yield* Effect.fail(
                new ValidationError({
                  domain: "MalvernFixtureImport",
                  message:
                    "No fixtures found in the Lacrosse Victoria/GameDay response",
                }),
              );
            }

            const rows = yield* repo.importFixtures(
              decoded,
              fixtures,
              sourceUrl,
            );
            return asFixtureImportResult({
              fixtures: rows.map((row) => asFixture(row)),
              imported: rows.length,
            });
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(notFound("MalvernTeam", input.teamPublicId)),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to import Malvern fixtures", e),
            ),
          ),

        submitTopThree: (input: SchemaInput<typeof SubmitTopThreeInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(SubmitTopThreeInput, input);
            return yield* repo.submitTopThree(decoded);
          }).pipe(
            Effect.map(asSubmission),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                notFound("MalvernSubmissionInput", input.fixturePublicId),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tap((submission) =>
              Effect.log(
                `Prepared top-three email for ${submission.recipientEmails.join(", ")}`,
              ),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to submit Malvern top three", e),
            ),
          ),

        listSubmissions: (
          input: SchemaInput<typeof ListTopThreeSubmissionsInput>,
        ) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              ListTopThreeSubmissionsInput,
              input,
            );
            return yield* repo.listSubmissions(decoded);
          }).pipe(
            Effect.map((rows) => rows.map((row) => asSubmission(row))),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError((e) =>
              Effect.logError("Failed to list Malvern submissions", e),
            ),
          ),
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(MalvernRepo.layer),
  );
}
