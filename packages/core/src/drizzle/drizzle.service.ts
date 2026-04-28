import {
  drizzle,
  type AnyD1Database,
  type DrizzleD1Database,
} from "drizzle-orm/d1";
import { Array as Arr, Effect, Layer, ServiceMap } from "effect";

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

export class DrizzleService extends ServiceMap.Service<
  DrizzleService,
  DrizzleD1Database
>()("DrizzleService") {}

// ---------------------------------------------------------------------------
// Cloudflare D1 binding resolution
// ---------------------------------------------------------------------------

const getProperty = (value: object, key: PropertyKey): unknown => {
  let current: object | null = value;
  while (current !== null) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor !== undefined && "value" in descriptor) {
      const property: unknown = descriptor.value;
      return property;
    }
    const prototype: unknown = Object.getPrototypeOf(current);
    current =
      typeof prototype === "object" && prototype !== null ? prototype : null;
  }
};

const isRecord = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

const hasFunctionProperty = (value: object, key: PropertyKey) =>
  typeof getProperty(value, key) === "function";

const isD1Binding = (value: unknown): value is AnyD1Database =>
  isRecord(value) &&
  hasFunctionProperty(value, "prepare") &&
  hasFunctionProperty(value, "batch");

const getD1Binding = Effect.try({
  try: (): unknown => {
    // oxlint-disable-next-line eslint-plugin-import/no-unassigned-import -- cloudflare:workers is only available inside Worker runtime
    const workersModule: unknown = require("cloudflare:workers");
    return workersModule;
  },
  catch: (cause) => new Error(String(cause)),
}).pipe(
  Effect.flatMap((workersModule) => {
    if (!isRecord(workersModule)) {
      return Effect.fail(new Error("cloudflare:workers module unavailable"));
    }

    const workersEnv = getProperty(workersModule, "env");
    if (!isRecord(workersEnv)) {
      return Effect.fail(new Error("Cloudflare env unavailable"));
    }

    const binding = getProperty(workersEnv, "DB");
    return isD1Binding(binding)
      ? Effect.succeed(binding)
      : Effect.fail(new Error("D1 DB binding not available"));
  }),
);

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

const DrizzleLive = Layer.effect(
  DrizzleService,
  Effect.map(getD1Binding, (binding) => drizzle(binding)),
);

export const DatabaseLive = DrizzleLive;
