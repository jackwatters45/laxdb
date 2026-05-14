import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { Context, Layer } from "effect";

export class Db extends Context.Service<Db, DrizzleD1Database>()(
  "@laxdb/fines/Db",
) {}

export const DbLive = (d1: D1Database): Layer.Layer<Db> =>
  Layer.succeed(Db, drizzle(d1));
