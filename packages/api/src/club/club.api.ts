import { ClubApiPayload, ClubContract } from "@laxdb/core/club/club.contract";
import {
  AuthenticationError,
  AuthorizationError,
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from "effect/unstable/httpapi";

import { EmptyPayload } from "../shared/payload";

const ClubErrors = [
  AuthenticationError.pipe(HttpApiSchema.status(401)),
  AuthorizationError.pipe(HttpApiSchema.status(403)),
  NotFoundError.pipe(HttpApiSchema.status(404)),
  ValidationError.pipe(HttpApiSchema.status(400)),
  DatabaseError.pipe(HttpApiSchema.status(500)),
  ConstraintViolationError.pipe(HttpApiSchema.status(409)),
] as const;

const listTeams = HttpApiEndpoint.post("listTeams", "/api/teams/list", {
  success: ClubContract.listTeams.success,
  error: ClubErrors,
  payload: EmptyPayload,
});

const createTeam = HttpApiEndpoint.post("createTeam", "/api/teams/create", {
  success: ClubContract.createTeam.success,
  error: ClubErrors,
  payload: ClubApiPayload.createTeam,
});

const updateTeam = HttpApiEndpoint.post("updateTeam", "/api/teams/update", {
  success: ClubContract.updateTeam.success,
  error: ClubErrors,
  payload: ClubApiPayload.updateTeam,
});

const deleteTeam = HttpApiEndpoint.post("deleteTeam", "/api/teams/delete", {
  success: ClubContract.deleteTeam.success,
  error: ClubErrors,
  payload: ClubApiPayload.byId,
});

const listRoster = HttpApiEndpoint.post("listRoster", "/api/roster/list", {
  success: ClubContract.listRoster.success,
  error: ClubErrors,
  payload: ClubApiPayload.teamScoped,
});

const addRosterPlayer = HttpApiEndpoint.post(
  "addRosterPlayer",
  "/api/roster/add",
  {
    success: ClubContract.addRosterPlayer.success,
    error: ClubErrors,
    payload: ClubApiPayload.addRosterPlayer,
  },
);

const updateRosterPlayer = HttpApiEndpoint.post(
  "updateRosterPlayer",
  "/api/roster/update",
  {
    success: ClubContract.updateRosterPlayer.success,
    error: ClubErrors,
    payload: ClubApiPayload.updateRosterPlayer,
  },
);

const removeRosterPlayer = HttpApiEndpoint.post(
  "removeRosterPlayer",
  "/api/roster/remove",
  {
    success: ClubContract.removeRosterPlayer.success,
    error: ClubErrors,
    payload: ClubApiPayload.byId,
  },
);

const listRecipients = HttpApiEndpoint.post(
  "listRecipients",
  "/api/recipients/list",
  {
    success: ClubContract.listRecipients.success,
    error: ClubErrors,
    payload: EmptyPayload,
  },
);

const listRecipientsForTeam = HttpApiEndpoint.post(
  "listRecipientsForTeam",
  "/api/recipients/for-team",
  {
    success: ClubContract.listRecipientsForTeam.success,
    error: ClubErrors,
    payload: ClubApiPayload.teamScoped,
  },
);

const addRecipient = HttpApiEndpoint.post(
  "addRecipient",
  "/api/recipients/add",
  {
    success: ClubContract.addRecipient.success,
    error: ClubErrors,
    payload: ClubApiPayload.addRecipient,
  },
);

const removeRecipient = HttpApiEndpoint.post(
  "removeRecipient",
  "/api/recipients/remove",
  {
    success: ClubContract.removeRecipient.success,
    error: ClubErrors,
    payload: ClubApiPayload.byId,
  },
);

export const ClubGroup = HttpApiGroup.make("Club")
  .add(listTeams)
  .add(createTeam)
  .add(updateTeam)
  .add(deleteTeam)
  .add(listRoster)
  .add(addRosterPlayer)
  .add(updateRosterPlayer)
  .add(removeRosterPlayer)
  .add(listRecipients)
  .add(listRecipientsForTeam)
  .add(addRecipient)
  .add(removeRecipient);
