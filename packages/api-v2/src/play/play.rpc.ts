import { PlayContract } from "@laxdb/core-v2/play/play.contract";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export class PlayRpcs extends RpcGroup.make(
  Rpc.make("PlayList", {
    success: PlayContract.list.success,
    error: PlayContract.list.error,
    payload: PlayContract.list.payload,
  }),
  Rpc.make("PlayGet", {
    success: PlayContract.get.success,
    error: PlayContract.get.error,
    payload: PlayContract.get.payload,
  }),
  Rpc.make("PlayCreate", {
    success: PlayContract.create.success,
    error: PlayContract.create.error,
    payload: PlayContract.create.payload,
  }),
  Rpc.make("PlayUpdate", {
    success: PlayContract.update.success,
    error: PlayContract.update.error,
    payload: PlayContract.update.payload,
  }),
  Rpc.make("PlayDelete", {
    success: PlayContract.delete.success,
    error: PlayContract.delete.error,
    payload: PlayContract.delete.payload,
  }),
) {}
