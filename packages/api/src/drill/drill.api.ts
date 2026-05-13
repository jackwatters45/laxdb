import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DrillHttpErrors, DrillOperations } from "./drill.operations";

export const DrillsGroup = HttpApiGroup.make("Drills")
  .add(
    HttpApiEndpoint.post(
      DrillOperations.list.httpName,
      DrillOperations.list.path,
      {
        success: DrillOperations.list.contract.success,
        error: DrillHttpErrors,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      DrillOperations.get.httpName,
      DrillOperations.get.path,
      {
        success: DrillOperations.get.contract.success,
        error: DrillHttpErrors,
        payload: DrillOperations.get.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      DrillOperations.create.httpName,
      DrillOperations.create.path,
      {
        success: DrillOperations.create.contract.success,
        error: DrillHttpErrors,
        payload: DrillOperations.create.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      DrillOperations.update.httpName,
      DrillOperations.update.path,
      {
        success: DrillOperations.update.contract.success,
        error: DrillHttpErrors,
        payload: DrillOperations.update.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      DrillOperations.delete.httpName,
      DrillOperations.delete.path,
      {
        success: DrillOperations.delete.contract.success,
        error: DrillHttpErrors,
        payload: DrillOperations.delete.contract.payload,
      },
    ),
  );
