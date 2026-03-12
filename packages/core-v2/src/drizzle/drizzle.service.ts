import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import { SqlError } from "@effect/sql/SqlError";
import { PgDeleteBase, PgInsertBase, PgUpdateBase } from "drizzle-orm/pg-core";
import { Cause, Console, Effect, Effectable, Layer, Redacted } from "effect";

// @effect/sql-drizzle only patches QueryPromise + PgSelectBase prototypes
// with Effect's CommitPrototype (making .pipe() work). Insert/update/delete
// use different base classes that are missing the patch. We replicate the
// same PatchProto from @effect/sql-drizzle/internal/patch here.
const PatchProto = {
  // oxlint-disable-next-line no-misused-spread
  ...Effectable.CommitPrototype,
  commit(this: { execute(): Promise<unknown> }) {
    return Effect.tryPromise({
      try: () => this.execute(),
      catch: (cause) =>
        new SqlError({ cause, message: "Failed to execute QueryPromise" }),
    });
  },
};

for (const proto of [
  PgInsertBase.prototype,
  PgUpdateBase.prototype,
  PgDeleteBase.prototype,
]) {
  if (!(Effect.EffectTypeId in proto)) {
    Object.assign(proto, PatchProto);
  }
}

const fromHyperdrive = Effect.try(() => {
  // oxlint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-type-assertion
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
