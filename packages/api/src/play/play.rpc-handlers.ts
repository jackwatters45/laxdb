import { PlayService } from "@laxdb/core/play/play.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PlayRpcs } from "./play.rpc";

export const PlayRpcHandlers = PlayRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayService;

    return withRpcLogging({
      PlayList: service.list,
      PlayGet: service.get,
      PlayCreate: service.create,
      PlayUpdate: service.update,
      PlayDelete: service.delete,
    });
  }),
).pipe(Layer.provide(PlayService.layer));
