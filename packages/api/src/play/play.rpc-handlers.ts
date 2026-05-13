import { PlayService } from "@laxdb/core/play/play.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PlayOperations } from "./play.operations";
import { PlayRpcs } from "./play.rpc";

export const PlayRpcHandlers = PlayRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayService;

    return withRpcLogging({
      [PlayOperations.list.rpcName]: service.list,
      [PlayOperations.get.rpcName]: service.get,
      [PlayOperations.create.rpcName]: service.create,
      [PlayOperations.update.rpcName]: service.update,
      [PlayOperations.delete.rpcName]: service.delete,
    });
  }),
).pipe(Layer.provide(PlayService.layer));
