import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { TeamContract } from "@laxdb/core/team/team.contract";

// Group definition - no LaxdbApi import
export const TeamsGroup = HttpApiGroup.make("Teams")
  .add(
    HttpApiEndpoint.post("createTeam", "/api/teams/create")
      .addSuccess(TeamContract.create.success)
      .addError(TeamContract.create.error)
      .setPayload(TeamContract.create.payload),
  )
  .add(
    HttpApiEndpoint.post("updateTeam", "/api/teams/update")
      .addSuccess(TeamContract.update.success)
      .addError(TeamContract.update.error)
      .setPayload(TeamContract.update.payload),
  )
  .add(
    HttpApiEndpoint.post("deleteTeam", "/api/teams/delete")
      .addSuccess(TeamContract.delete.success)
      .addError(TeamContract.delete.error)
      .setPayload(TeamContract.delete.payload),
  )
  .add(
    HttpApiEndpoint.post("getMembers", "/api/teams/members")
      .addSuccess(TeamContract.getMembers.success)
      .addError(TeamContract.getMembers.error)
      .setPayload(TeamContract.getMembers.payload),
  )
  .add(
    HttpApiEndpoint.post("invitePlayer", "/api/teams/invite-player")
      .addSuccess(TeamContract.invitePlayer.success)
      .addError(TeamContract.invitePlayer.error)
      .setPayload(TeamContract.invitePlayer.payload),
  )
  .add(
    HttpApiEndpoint.post("removeMember", "/api/teams/remove-member")
      .addSuccess(TeamContract.removeMember.success)
      .addError(TeamContract.removeMember.error)
      .setPayload(TeamContract.removeMember.payload),
  );

// Legacy: Standalone API for client type inference
export const TeamsApi = HttpApi.make("TeamsApi").add(TeamsGroup);
