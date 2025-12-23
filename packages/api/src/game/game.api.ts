import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { GameContract } from "@laxdb/core/game/game.contract";
import { GameService } from "@laxdb/core/game/game.service";
import { Effect, Layer } from "effect";

export const GamesApi = HttpApi.make("GamesApi").add(
  HttpApiGroup.make("Games")
    .add(
      HttpApiEndpoint.post("listGames", "/api/games")
        .addSuccess(GameContract.list.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(GameContract.list.payload),
    )
    .add(
      HttpApiEndpoint.post("getGame", "/api/games/get")
        .addSuccess(GameContract.get.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(GameContract.get.payload),
    )
    .add(
      HttpApiEndpoint.post("createGame", "/api/games/create")
        .addSuccess(GameContract.create.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(GameContract.create.payload),
    )
    .add(
      HttpApiEndpoint.post("updateGame", "/api/games/update")
        .addSuccess(GameContract.update.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(GameContract.update.payload),
    )
    .add(
      HttpApiEndpoint.post("deleteGame", "/api/games/delete")
        .addSuccess(GameContract.delete.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(GameContract.delete.payload),
    ),
);

const GamesApiHandlers = HttpApiBuilder.group(GamesApi, "Games", (handlers) =>
  Effect.gen(function* () {
    const service = yield* GameService;

    return handlers
      .handle("listGames", ({ payload }) => service.list(payload))
      .handle("getGame", ({ payload }) => service.get(payload))
      .handle("createGame", ({ payload }) => service.create(payload))
      .handle("updateGame", ({ payload }) => service.update(payload))
      .handle("deleteGame", ({ payload }) => service.delete(payload));
  }),
).pipe(Layer.provide(GameService.Default));

export const GamesApiLive = HttpApiBuilder.api(GamesApi).pipe(
  Layer.provide(GamesApiHandlers),
);
