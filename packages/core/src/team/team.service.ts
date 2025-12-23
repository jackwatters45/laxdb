import { Effect, Schema } from "effect";
import { AuthService } from "../auth";
import { OrganizationRepo } from "../organization/organization.repo";
import { TeamRepo } from "./team.repo";
import {
  CreateTeamInput,
  DeleteTeamInput,
  GetTeamMembersInput,
  InvitePlayerInput,
  RemoveTeamMemberInput,
  UpdateTeamInput,
} from "./team.schema";

// Teams Service
export class TeamService extends Effect.Service<TeamService>()("TeamService", {
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;
    const orgRepo = yield* OrganizationRepo;
    const teamRepo = yield* TeamRepo;

    return {
      createTeam: (input: CreateTeamInput, headers: Headers) =>
        Effect.gen(function* () {
          yield* auth.getSessionOrThrow(headers);

          const decoded = yield* Schema.decode(CreateTeamInput)(input);

          const activeOrganization =
            yield* auth.getActiveOrganizationOrThrow(headers);

          const result = yield* teamRepo.create(
            headers,
            decoded,
            activeOrganization.id,
          );

          return result;
        }),

      updateTeam: (input: UpdateTeamInput, headers: Headers) =>
        Effect.gen(function* () {
          const decoded = yield* Schema.decode(UpdateTeamInput)(input);

          return yield* teamRepo.update(headers, decoded);
        }),

      deleteTeam: (input: DeleteTeamInput, headers: Headers) =>
        Effect.gen(function* () {
          const decoded = yield* Schema.decode(DeleteTeamInput)(input);

          yield* teamRepo.delete(headers, decoded);
        }),

      getTeamMembers: (input: GetTeamMembersInput, headers: Headers) =>
        Effect.gen(function* () {
          const decoded = yield* Schema.decode(GetTeamMembersInput)(input);

          return yield* orgRepo.getTeamMembers(headers, decoded.teamId);
        }),

      invitePlayer: (input: InvitePlayerInput, headers: Headers) =>
        Effect.gen(function* () {
          const decoded = yield* Schema.decode(InvitePlayerInput)(input);

          yield* teamRepo.invite(decoded, headers);
        }),

      removeTeamMember: (input: RemoveTeamMemberInput, headers: Headers) =>
        Effect.gen(function* () {
          const decoded = yield* Schema.decode(RemoveTeamMemberInput)(input);

          yield* teamRepo.removeMember(decoded, headers);
        }),
    } as const;
  }),
  dependencies: [
    TeamRepo.Default,
    OrganizationRepo.Default,
    AuthService.Default,
  ],
}) {}
