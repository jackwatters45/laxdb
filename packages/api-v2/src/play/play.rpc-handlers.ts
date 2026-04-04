import { PlayService } from "@laxdb/core-v2/play/play.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PlayRpcs } from "./play.rpc";

export const PlayRpcHandlers = PlayRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayService;

    return withRpcLogging({
      PlayList: () => service.list(),
      PlayGet: (payload) => service.get(payload),
      PlayCreate: (payload) => service.create(payload),
      PlayUpdate: (payload) => service.update(payload),
      PlayDelete: (payload) => service.delete(payload),
    });
  }),
).pipe(Layer.provide(PlayService.layer));
