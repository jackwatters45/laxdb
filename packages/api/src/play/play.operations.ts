import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { PlayContract } from "@laxdb/core/play/play.contract";

export const PlayHttpErrors = [
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
] as const;

export const PlayOperations = {
  list: {
    rpcName: "PlayList",
    httpName: "listPlays",
    path: "/api/plays",
    contract: PlayContract.list,
  },
  get: {
    rpcName: "PlayGet",
    httpName: "getPlay",
    path: "/api/plays/get",
    contract: PlayContract.get,
  },
  create: {
    rpcName: "PlayCreate",
    httpName: "createPlay",
    path: "/api/plays/create",
    contract: PlayContract.create,
  },
  update: {
    rpcName: "PlayUpdate",
    httpName: "updatePlay",
    path: "/api/plays/update",
    contract: PlayContract.update,
  },
  delete: {
    rpcName: "PlayDelete",
    httpName: "deletePlay",
    path: "/api/plays/delete",
    contract: PlayContract.delete,
  },
} as const;

export const PlayRpcNames = Object.values(PlayOperations).map(
  (operation) => operation.rpcName,
);
