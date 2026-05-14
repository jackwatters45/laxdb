import { DrillContract } from "@laxdb/core/drill/drill.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DomainErrors } from "../errors";

export const DrillsGroup = HttpApiGroup.make("Drills")
  .add(
    HttpApiEndpoint.post("listDrills", "/api/drills", {
      success: DrillContract.list.success,
      error: DomainErrors,
    }),
  )
  .add(
    HttpApiEndpoint.post("getDrill", "/api/drills/get", {
      success: DrillContract.get.success,
      error: DomainErrors,
      payload: Schema.toEncoded(DrillContract.get.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("createDrill", "/api/drills/create", {
      success: DrillContract.create.success,
      error: DomainErrors,
      payload: Schema.toEncoded(DrillContract.create.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("updateDrill", "/api/drills/update", {
      success: DrillContract.update.success,
      error: DomainErrors,
      payload: Schema.toEncoded(DrillContract.update.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("deleteDrill", "/api/drills/delete", {
      success: DrillContract.delete.success,
      error: DomainErrors,
      payload: Schema.toEncoded(DrillContract.delete.payload),
    }),
  );
