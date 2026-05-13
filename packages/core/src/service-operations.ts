import { Effect, type Cause, type Schema } from "effect";

import { type SqlError } from "./drizzle/drizzle.service";
import type { NotFoundError } from "./error";
import { decodeArguments, parseSqlError } from "./util";

type ServiceLogError = (error: unknown) => Effect.Effect<void>;

type ServiceOperationOptions<Input, Entity> = {
  readonly notFound: (input: Input) => NotFoundError;
  readonly logError?: ServiceLogError;
  readonly tapSuccess?: (entity: Entity) => Effect.Effect<void>;
};

type SchemaType<S extends Schema.Top> = S["Type"];

const defaultLogError: ServiceLogError = (error) => Effect.logError(error);

const withSuccessTap = <Entity, Error, Requirements>(
  effect: Effect.Effect<Entity, Error, Requirements>,
  tapSuccess: ((entity: Entity) => Effect.Effect<void>) | undefined,
) => (tapSuccess === undefined ? effect : effect.pipe(Effect.tap(tapSuccess)));

export const listOperation = <Row, Entity>(
  rows: Effect.Effect<readonly Row[], SqlError>,
  toEntity: (row: Row) => Entity,
  logError: ServiceLogError = defaultLogError,
) =>
  rows.pipe(
    Effect.map((values) => values.map(toEntity)),
    Effect.catchTag("SqlError", (error) => Effect.fail(parseSqlError(error))),
    Effect.tapError(logError),
  );

export const decodedRowOperation = <S extends Schema.Top, Row, Entity>(
  schema: S,
  input: SchemaType<S>,
  run: (
    decoded: SchemaType<S>,
  ) => Effect.Effect<Row, SqlError | Cause.NoSuchElementError>,
  toEntity: (row: Row) => Entity,
  options: ServiceOperationOptions<SchemaType<S>, Entity>,
) =>
  withSuccessTap(
    Effect.gen(function* () {
      const decoded = yield* decodeArguments(schema, input);
      return yield* run(decoded);
    }).pipe(
      Effect.map(toEntity),
      Effect.catchTag("NoSuchElementError", () =>
        Effect.fail(options.notFound(input)),
      ),
      Effect.catchTag("SqlError", (error) => Effect.fail(parseSqlError(error))),
      Effect.tapError(options.logError ?? defaultLogError),
    ),
    options.tapSuccess,
  );

export const decodedRowsOperation = <S extends Schema.Top, Row, Entity>(
  schema: S,
  input: SchemaType<S>,
  run: (decoded: SchemaType<S>) => Effect.Effect<readonly Row[], SqlError>,
  toEntity: (row: Row) => Entity,
  logError: ServiceLogError = defaultLogError,
) =>
  Effect.gen(function* () {
    const decoded = yield* decodeArguments(schema, input);
    return yield* run(decoded);
  }).pipe(
    Effect.map((values) => values.map(toEntity)),
    Effect.catchTag("SqlError", (error) => Effect.fail(parseSqlError(error))),
    Effect.tapError(logError),
  );
