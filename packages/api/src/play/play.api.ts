import { PlayContract } from "@laxdb/core/play/play.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DomainErrors } from "../errors";

const listPlays = HttpApiEndpoint.post("listPlays", "/api/plays", {
  success: PlayContract.list.success,
  error: DomainErrors,
});

const getPlay = HttpApiEndpoint.post("getPlay", "/api/plays/get", {
  success: PlayContract.get.success,
  error: DomainErrors,
  payload: Schema.toEncoded(PlayContract.get.payload),
});

const createPlay = HttpApiEndpoint.post("createPlay", "/api/plays/create", {
  success: PlayContract.create.success,
  error: DomainErrors,
  payload: Schema.toEncoded(PlayContract.create.payload),
});

const updatePlay = HttpApiEndpoint.post("updatePlay", "/api/plays/update", {
  success: PlayContract.update.success,
  error: DomainErrors,
  payload: Schema.toEncoded(PlayContract.update.payload),
});

const deletePlay = HttpApiEndpoint.post("deletePlay", "/api/plays/delete", {
  success: PlayContract.delete.success,
  error: DomainErrors,
  payload: Schema.toEncoded(PlayContract.delete.payload),
});

export const PlaysGroup = HttpApiGroup.make("Plays")
  .add(listPlays)
  .add(getPlay)
  .add(createPlay)
  .add(updatePlay)
  .add(deletePlay);
