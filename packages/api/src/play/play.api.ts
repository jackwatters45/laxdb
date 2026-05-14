import { PlayContract } from "@laxdb/core/play/play.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DomainErrors } from "../errors";

export const PlaysGroup = HttpApiGroup.make("Plays")
  .add(
    HttpApiEndpoint.post("listPlays", "/api/plays", {
      success: PlayContract.list.success,
      error: DomainErrors,
    }),
  )
  .add(
    HttpApiEndpoint.post("getPlay", "/api/plays/get", {
      success: PlayContract.get.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PlayContract.get.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("createPlay", "/api/plays/create", {
      success: PlayContract.create.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PlayContract.create.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("updatePlay", "/api/plays/update", {
      success: PlayContract.update.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PlayContract.update.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("deletePlay", "/api/plays/delete", {
      success: PlayContract.delete.success,
      error: DomainErrors,
      payload: Schema.toEncoded(PlayContract.delete.payload),
    }),
  );
