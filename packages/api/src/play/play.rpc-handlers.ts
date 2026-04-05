import type {
  CreatePlayInput,
  DeletePlayInput,
  GetPlayInput,
  UpdatePlayInput,
} from "@laxdb/core/play/play.schema";
import { PlayService } from "@laxdb/core/play/play.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { PlayRpcs } from "./play.rpc";

export const PlayRpcHandlers = PlayRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayService;

    return withRpcLogging({
      PlayList: () => service.list(),
      PlayGet: (payload: GetPlayInput) => service.get(payload),
      PlayCreate: (payload: CreatePlayInput) => service.create(payload),
      PlayUpdate: (payload: UpdatePlayInput) => service.update(payload),
      PlayDelete: (payload: DeletePlayInput) => service.delete(payload),
    });
  }),
).pipe(Layer.provide(PlayService.layer));
