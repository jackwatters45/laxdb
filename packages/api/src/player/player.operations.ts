import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { PlayerContract } from "@laxdb/core/player/player.contract";

export const PlayerHttpErrors = [
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
] as const;

export const PlayerOperations = {
  list: {
    rpcName: "PlayerList",
    httpName: "listPlayers",
    path: "/api/players",
    contract: PlayerContract.list,
  },
  get: {
    rpcName: "PlayerGet",
    httpName: "getPlayer",
    path: "/api/players/get",
    contract: PlayerContract.get,
  },
  create: {
    rpcName: "PlayerCreate",
    httpName: "createPlayer",
    path: "/api/players/create",
    contract: PlayerContract.create,
  },
  update: {
    rpcName: "PlayerUpdate",
    httpName: "updatePlayer",
    path: "/api/players/update",
    contract: PlayerContract.update,
  },
  delete: {
    rpcName: "PlayerDelete",
    httpName: "deletePlayer",
    path: "/api/players/delete",
    contract: PlayerContract.delete,
  },
} as const;

export const PlayerRpcNames = Object.values(PlayerOperations).map(
  (operation) => operation.rpcName,
);
