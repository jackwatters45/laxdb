import { Effect, Layer, ServiceMap } from "effect";

import { NotFoundError } from "../error";
import { decodedRowOperation, listOperation } from "../service-operations";

import { PlayerRepo } from "./player.repo";
import {
  CreatePlayerInput,
  Player,
  PlayerByIdInput,
  UpdatePlayerInput,
} from "./player.schema";

const asPlayer = (row: typeof Player.Type) => new Player(row);

export class PlayerService extends ServiceMap.Service<PlayerService>()(
  "PlayerService",
  {
    make: Effect.gen(function* () {
      const repo = yield* PlayerRepo;

      return {
        list: () =>
          listOperation(repo.list(), asPlayer, (error) =>
            Effect.logError("Failed to list players", error),
          ),

        getByPublicId: (input: PlayerByIdInput) =>
          decodedRowOperation(
            PlayerByIdInput,
            input,
            (decoded) => repo.getByPublicId(decoded.publicId),
            asPlayer,
            {
              notFound: ({ publicId }) =>
                new NotFoundError({ domain: "Player", id: publicId }),
              logError: (error) =>
                Effect.logError("Failed to get player", error),
            },
          ),

        create: (input: CreatePlayerInput) =>
          decodedRowOperation(CreatePlayerInput, input, repo.create, asPlayer, {
            notFound: () =>
              new NotFoundError({ domain: "Player", id: "create" }),
            tapSuccess: (player) =>
              Effect.log(`Created player: ${player.name}`),
            logError: (error) =>
              Effect.logError("Failed to create player", error),
          }),

        update: (input: UpdatePlayerInput) =>
          decodedRowOperation(
            UpdatePlayerInput,
            input,
            (decoded) => repo.update(decoded.publicId, decoded),
            asPlayer,
            {
              notFound: ({ publicId }) =>
                new NotFoundError({ domain: "Player", id: publicId }),
              tapSuccess: (player) =>
                Effect.log(`Updated player: ${player.name}`),
              logError: (error) =>
                Effect.logError("Failed to update player", error),
            },
          ),

        delete: (input: PlayerByIdInput) =>
          decodedRowOperation(
            PlayerByIdInput,
            input,
            (decoded) => repo.delete(decoded.publicId),
            asPlayer,
            {
              notFound: ({ publicId }) =>
                new NotFoundError({ domain: "Player", id: publicId }),
              tapSuccess: (player) =>
                Effect.log(`Deleted player: ${player.name}`),
              logError: (error) =>
                Effect.logError("Failed to delete player", error),
            },
          ),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(PlayerRepo.layer),
  );
}
