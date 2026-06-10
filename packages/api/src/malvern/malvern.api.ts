import {
  AuthenticationError,
  AuthorizationError,
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import {
  MalvernApiPayload,
  MalvernContract,
} from "@laxdb/core/malvern/malvern.contract";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from "effect/unstable/httpapi";

import { EmptyPayload } from "../shared/payload";

const MalvernEndpointErrors = [
  AuthenticationError.pipe(HttpApiSchema.status(401)),
  AuthorizationError.pipe(HttpApiSchema.status(403)),
  NotFoundError.pipe(HttpApiSchema.status(404)),
  ValidationError.pipe(HttpApiSchema.status(400)),
  DatabaseError.pipe(HttpApiSchema.status(500)),
  ConstraintViolationError.pipe(HttpApiSchema.status(409)),
] as const;

const listTeams = HttpApiEndpoint.post("listTeams", "/api/malvern/teams", {
  success: MalvernContract.listTeams.success,
  error: MalvernEndpointErrors,
  payload: EmptyPayload,
});

const getTeam = HttpApiEndpoint.post("getTeam", "/api/malvern/teams/get", {
  success: MalvernContract.getTeam.success,
  error: MalvernEndpointErrors,
  payload: MalvernApiPayload.teamScoped,
});

const createTeam = HttpApiEndpoint.post(
  "createTeam",
  "/api/malvern/teams/create",
  {
    success: MalvernContract.createTeam.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.createTeam,
  },
);

const updateTeam = HttpApiEndpoint.post(
  "updateTeam",
  "/api/malvern/teams/update",
  {
    success: MalvernContract.updateTeam.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.updateTeam,
  },
);

const assignCoach = HttpApiEndpoint.post(
  "assignCoach",
  "/api/malvern/coaches/assign",
  {
    success: MalvernContract.assignCoach.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.assignCoach,
  },
);

const listCoaches = HttpApiEndpoint.post(
  "listCoaches",
  "/api/malvern/coaches/list",
  {
    success: MalvernContract.listCoaches.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.teamScoped,
  },
);

const listPlayers = HttpApiEndpoint.post(
  "listPlayers",
  "/api/malvern/players",
  {
    success: MalvernContract.listPlayers.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.teamScoped,
  },
);

const createPlayer = HttpApiEndpoint.post(
  "createPlayer",
  "/api/malvern/players/create",
  {
    success: MalvernContract.createPlayer.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.createPlayer,
  },
);

const updatePlayer = HttpApiEndpoint.post(
  "updatePlayer",
  "/api/malvern/players/update",
  {
    success: MalvernContract.updatePlayer.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.updatePlayer,
  },
);

const listFixtures = HttpApiEndpoint.post(
  "listFixtures",
  "/api/malvern/fixtures",
  {
    success: MalvernContract.listFixtures.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.teamScoped,
  },
);

const syncFixtures = HttpApiEndpoint.post(
  "syncFixtures",
  "/api/malvern/fixtures/sync",
  {
    success: MalvernContract.importFixtures.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.syncFixtures,
  },
);

const submitTopThree = HttpApiEndpoint.post(
  "submitTopThree",
  "/api/malvern/top-three/submit",
  {
    success: MalvernContract.submitTopThree.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.submitTopThree,
  },
);

const listSubmissions = HttpApiEndpoint.post(
  "listSubmissions",
  "/api/malvern/top-three/submissions",
  {
    success: MalvernContract.listSubmissions.success,
    error: MalvernEndpointErrors,
    payload: MalvernApiPayload.listSubmissions,
  },
);

export const MalvernGroup = HttpApiGroup.make("Malvern")
  .add(listTeams)
  .add(getTeam)
  .add(createTeam)
  .add(updateTeam)
  .add(assignCoach)
  .add(listCoaches)
  .add(listPlayers)
  .add(createPlayer)
  .add(updatePlayer)
  .add(listFixtures)
  .add(syncFixtures)
  .add(submitTopThree)
  .add(listSubmissions);
