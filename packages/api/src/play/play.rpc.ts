import { Rpc, RpcGroup } from "effect/unstable/rpc";

import { PlayOperations } from "./play.operations";

export class PlayRpcs extends RpcGroup.make(
  Rpc.make(PlayOperations.list.rpcName, PlayOperations.list.contract),
  Rpc.make(PlayOperations.get.rpcName, PlayOperations.get.contract),
  Rpc.make(PlayOperations.create.rpcName, PlayOperations.create.contract),
  Rpc.make(PlayOperations.update.rpcName, PlayOperations.update.contract),
  Rpc.make(PlayOperations.delete.rpcName, PlayOperations.delete.contract),
) {}
