import { Rpc, RpcGroup } from "effect/unstable/rpc";

import { PlayerOperations } from "./player.operations";

export class PlayerRpcs extends RpcGroup.make(
  Rpc.make(PlayerOperations.list.rpcName, PlayerOperations.list.contract),
  Rpc.make(PlayerOperations.get.rpcName, PlayerOperations.get.contract),
  Rpc.make(PlayerOperations.create.rpcName, PlayerOperations.create.contract),
  Rpc.make(PlayerOperations.update.rpcName, PlayerOperations.update.contract),
  Rpc.make(PlayerOperations.delete.rpcName, PlayerOperations.delete.contract),
) {}
