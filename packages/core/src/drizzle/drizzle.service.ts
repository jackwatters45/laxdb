import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import { Cause, Console, Effect, Layer, Redacted } from "effect";

const fromHyperdrive = Effect.try(() => {
  // oxlint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require("cloudflare:workers") as {
    env: { DB?: { connectionString: string } };
  };
  return env.DB?.connectionString;
}).pipe(
  Effect.flatMap((url) =>
    url
      ? Effect.succeed({ url: Redacted.make(url), ssl: false as const })
      : Effect.fail(new Error("Hyperdrive binding not available")),
  ),
);

const fromDatabaseUrl = Effect.try(() => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable not set");
  }
  return { url: Redacted.make(url), ssl: true as const };
});

const getConnectionConfig = fromHyperdrive.pipe(
  Effect.catchAll(() => fromDatabaseUrl),
);

const PgLive = Layer.unwrapEffect(
  Effect.map(getConnectionConfig, ({ url, ssl }) =>
    PgClient.layer({ url, ssl }).pipe(
      Layer.tapErrorCause((cause) => Console.log(Cause.pretty(cause))),
      Layer.orDie,
    ),
  ),
);

const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive));

export const DatabaseLive = Layer.mergeAll(PgLive, DrizzleLive);
