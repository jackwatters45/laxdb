import { PlayerService } from "@laxdb/core-v2/player/player.service";
import { Effect, Layer } from "effect";

import { asPlayer } from "../lib/mappers";

import { PlayerRpcs } from "./player.rpc";

export const PlayerRpcHandlers = PlayerRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerService;

    return {
      PlayerList: () =>
        service.list().pipe(Effect.map((rows) => rows.map(asPlayer))),
      PlayerGet: (payload) =>
        service.getByPublicId(payload).pipe(Effect.map(asPlayer)),
      PlayerCreate: (payload) =>
        service.create(payload).pipe(Effect.map(asPlayer)),
      PlayerUpdate: (payload) =>
        service.update(payload).pipe(Effect.map(asPlayer)),
      PlayerDelete: (payload) =>
        service.delete(payload).pipe(Effect.map(asPlayer)),
    };
  }),
).pipe(Layer.provide(PlayerService.layer));
