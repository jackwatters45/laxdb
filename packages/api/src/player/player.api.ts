import { PlayerContract } from "@laxdb/core/player/player.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DomainErrors } from "../errors";

const listPlayers = HttpApiEndpoint.post("listPlayers", "/api/players", {
  success: PlayerContract.list.success,
  error: DomainErrors,
});

const getPlayer = HttpApiEndpoint.post("getPlayer", "/api/players/get", {
  success: PlayerContract.get.success,
  error: DomainErrors,
  payload: Schema.toEncoded(PlayerContract.get.payload),
});

const createPlayer = HttpApiEndpoint.post(
  "createPlayer",
  "/api/players/create",
  {
    success: PlayerContract.create.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PlayerContract.create.payload),
  },
);

const updatePlayer = HttpApiEndpoint.post(
  "updatePlayer",
  "/api/players/update",
  {
    success: PlayerContract.update.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PlayerContract.update.payload),
  },
);

const deletePlayer = HttpApiEndpoint.post(
  "deletePlayer",
  "/api/players/delete",
  {
    success: PlayerContract.delete.success,
    error: DomainErrors,
    payload: Schema.toEncoded(PlayerContract.delete.payload),
  },
);

export const PlayersGroup = HttpApiGroup.make("Players")
  .add(listPlayers)
  .add(getPlayer)
  .add(createPlayer)
  .add(updatePlayer)
  .add(deletePlayer);
