import { Effect, Layer, ServiceMap } from "effect";

import { NotFoundError } from "../error";
import { decodeArguments, parsePostgresError } from "../util";

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
          repo.list().pipe(
            Effect.map((rows) => rows.map(asPlayer)),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to list players", e),
            ),
          ),

        getByPublicId: (input: PlayerByIdInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(PlayerByIdInput, input);
            return yield* repo.getByPublicId(decoded.publicId);
          }).pipe(
            Effect.map(asPlayer),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Player", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) => Effect.logError("Failed to get player", e)),
          ),

        create: (input: CreatePlayerInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreatePlayerInput, input);
            return yield* repo.create(decoded);
          }).pipe(
            Effect.map(asPlayer),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Player", id: "create" }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((p) => Effect.log(`Created player: ${p.name}`)),
            Effect.tapError((e) =>
              Effect.logError("Failed to create player", e),
            ),
          ),

        update: (input: UpdatePlayerInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdatePlayerInput, input);
            return yield* repo.update(decoded.publicId, decoded);
          }).pipe(
            Effect.map(asPlayer),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Player", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((p) => Effect.log(`Updated player: ${p.name}`)),
            Effect.tapError((e) =>
              Effect.logError("Failed to update player", e),
            ),
          ),

        delete: (input: PlayerByIdInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(PlayerByIdInput, input);
            return yield* repo.delete(decoded.publicId);
          }).pipe(
            Effect.map(asPlayer),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Player", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((p) => Effect.log(`Deleted player: ${p.name}`)),
            Effect.tapError((e) =>
              Effect.logError("Failed to delete player", e),
            ),
          ),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(PlayerRepo.layer),
  );
}
