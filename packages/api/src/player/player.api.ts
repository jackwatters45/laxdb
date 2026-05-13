import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { PlayerHttpErrors, PlayerOperations } from "./player.operations";

export const PlayersGroup = HttpApiGroup.make("Players")
  .add(
    HttpApiEndpoint.post(
      PlayerOperations.list.httpName,
      PlayerOperations.list.path,
      {
        success: PlayerOperations.list.contract.success,
        error: PlayerHttpErrors,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PlayerOperations.get.httpName,
      PlayerOperations.get.path,
      {
        success: PlayerOperations.get.contract.success,
        error: PlayerHttpErrors,
        payload: PlayerOperations.get.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PlayerOperations.create.httpName,
      PlayerOperations.create.path,
      {
        success: PlayerOperations.create.contract.success,
        error: PlayerHttpErrors,
        payload: PlayerOperations.create.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PlayerOperations.update.httpName,
      PlayerOperations.update.path,
      {
        success: PlayerOperations.update.contract.success,
        error: PlayerHttpErrors,
        payload: PlayerOperations.update.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PlayerOperations.delete.httpName,
      PlayerOperations.delete.path,
      {
        success: PlayerOperations.delete.contract.success,
        error: PlayerHttpErrors,
        payload: PlayerOperations.delete.contract.payload,
      },
    ),
  );
