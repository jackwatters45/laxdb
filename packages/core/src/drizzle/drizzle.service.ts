import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Array as Arr, Effect, Layer, ServiceMap } from "effect";
import { Pool } from "pg";

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
  execute(): Promise<T>;
}): Effect.Effect<T, SqlError> =>
  Effect.tryPromise({
    try: () => queryBuilder.execute(),
    catch: (cause) => new SqlError(cause),
  });

/** Take first element from array as Effect — fails with NoSuchElementError */
export const headOrFail = <A>(arr: readonly A[]) =>
  Effect.fromOption(Arr.head(arr));

// ---------------------------------------------------------------------------
// PgDrizzle service — provides a typed drizzle instance
// ---------------------------------------------------------------------------

export class PgDrizzle extends ServiceMap.Service<PgDrizzle, NodePgDatabase>()(
  "PgDrizzle",
) {}

// ---------------------------------------------------------------------------
// Connection config resolution
// ---------------------------------------------------------------------------

const fromHyperdrive = Effect.try({
  try: () => {
    // oxlint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-type-assertion
    const { env } = require("cloudflare:workers") as {
      env: { DB?: { connectionString: string } };
    };
    return env.DB?.connectionString;
  },
  catch: (cause) => new Error(String(cause)),
}).pipe(
  Effect.flatMap((url) =>
    url
      ? Effect.succeed({ url, ssl: false as const })
      : Effect.fail(new Error("Hyperdrive binding not available")),
  ),
);

const fromDatabaseUrl = Effect.try({
  try: () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable not set");
    }
    return { url, ssl: true as const };
  },
  catch: (cause) => new Error(String(cause)),
});

const getConnectionConfig = Effect.matchEffect(fromHyperdrive, {
  onFailure: () => fromDatabaseUrl,
  onSuccess: Effect.succeed,
});

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

const DrizzleLive = Layer.effect(
  PgDrizzle,
  Effect.map(getConnectionConfig, ({ url, ssl }) => {
    const pool = new Pool({
      connectionString: url,
      ssl: ssl ? { rejectUnauthorized: false } : false,
    });
    return drizzle({ client: pool });
  }),
);

export const DatabaseLive = DrizzleLive;
