import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { PlayHttpErrors, PlayOperations } from "./play.operations";

export const PlaysGroup = HttpApiGroup.make("Plays")
  .add(
    HttpApiEndpoint.post(
      PlayOperations.list.httpName,
      PlayOperations.list.path,
      {
        success: PlayOperations.list.contract.success,
        error: PlayHttpErrors,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(PlayOperations.get.httpName, PlayOperations.get.path, {
      success: PlayOperations.get.contract.success,
      error: PlayHttpErrors,
      payload: PlayOperations.get.contract.payload,
    }),
  )
  .add(
    HttpApiEndpoint.post(
      PlayOperations.create.httpName,
      PlayOperations.create.path,
      {
        success: PlayOperations.create.contract.success,
        error: PlayHttpErrors,
        payload: PlayOperations.create.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PlayOperations.update.httpName,
      PlayOperations.update.path,
      {
        success: PlayOperations.update.contract.success,
        error: PlayHttpErrors,
        payload: PlayOperations.update.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PlayOperations.delete.httpName,
      PlayOperations.delete.path,
      {
        success: PlayOperations.delete.contract.success,
        error: PlayHttpErrors,
        payload: PlayOperations.delete.contract.payload,
      },
    ),
  );
