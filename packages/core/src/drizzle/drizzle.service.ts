import {
  drizzle,
  type AnyD1Database,
  type DrizzleD1Database,
} from "drizzle-orm/d1";
import { Array as Arr, Effect, Layer, Context } from "effect";

// ---------------------------------------------------------------------------
// SqlError — lightweight tagged error for drizzle query failures
// ---------------------------------------------------------------------------

export class SqlError {
  readonly _tag = "SqlError" as const;
  constructor(
    readonly cause: unknown,
    readonly message: string = "Query failed",
  ) {}
}

// ---------------------------------------------------------------------------
// Drizzle query helper — wraps a drizzle query builder into an Effect
// ---------------------------------------------------------------------------

export const query = <T>(queryBuilder: {
  execute(): T | Promise<T>;
}): Effect.Effect<T, SqlError> =>
  Effect.tryPromise({
    try: () => Promise.resolve(queryBuilder.execute()),
    catch: (cause) => new SqlError(cause),
  });

/** Take first element from array as Effect — fails with NoSuchElementError */
export const headOrFail = <A>(arr: readonly A[]) =>
  Effect.fromOption(Arr.head(arr));

// ---------------------------------------------------------------------------
// DrizzleService — provides a typed Cloudflare D1 drizzle instance
// ---------------------------------------------------------------------------

export class DrizzleService extends Context.Service<
  DrizzleService,
  DrizzleD1Database
>()("DrizzleService") {}

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

export class D1DatabaseBinding extends Context.Service<
  D1DatabaseBinding,
  AnyD1Database
>()("D1DatabaseBinding") {}

export const DatabaseLive = Layer.effect(
  DrizzleService,
  Effect.gen(function* () {
    const binding = yield* D1DatabaseBinding;
    return drizzle(binding);
  }),
);

export const DatabaseLiveFromBinding = (binding: AnyD1Database) =>
  DatabaseLive.pipe(Layer.provide(Layer.succeed(D1DatabaseBinding, binding)));

export const DatabaseLiveFromBindingEffect = (
  binding: Effect.Effect<AnyD1Database>,
) =>
  Layer.effect(
    DrizzleService,
    Effect.map(binding, (db) => drizzle(db)),
  );
