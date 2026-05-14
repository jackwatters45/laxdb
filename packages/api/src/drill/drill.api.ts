import { DrillContract } from "@laxdb/core/drill/drill.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DomainErrors } from "../errors";

const listDrills = HttpApiEndpoint.post("listDrills", "/api/drills", {
  success: DrillContract.list.success,
  error: DomainErrors,
});

const getDrill = HttpApiEndpoint.post("getDrill", "/api/drills/get", {
  success: DrillContract.get.success,
  error: DomainErrors,
  payload: Schema.toEncoded(DrillContract.get.payload),
});

const createDrill = HttpApiEndpoint.post("createDrill", "/api/drills/create", {
  success: DrillContract.create.success,
  error: DomainErrors,
  payload: Schema.toEncoded(DrillContract.create.payload),
});

const updateDrill = HttpApiEndpoint.post("updateDrill", "/api/drills/update", {
  success: DrillContract.update.success,
  error: DomainErrors,
  payload: Schema.toEncoded(DrillContract.update.payload),
});

const deleteDrill = HttpApiEndpoint.post("deleteDrill", "/api/drills/delete", {
  success: DrillContract.delete.success,
  error: DomainErrors,
  payload: Schema.toEncoded(DrillContract.delete.payload),
});

export const DrillsGroup = HttpApiGroup.make("Drills")
  .add(listDrills)
  .add(getDrill)
  .add(createDrill)
  .add(updateDrill)
  .add(deleteDrill);
