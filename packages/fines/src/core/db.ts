import { DatabaseLiveFromBinding } from "@laxdb/core/drizzle/drizzle.service";

export { DrizzleService as Db } from "@laxdb/core/drizzle/drizzle.service";

export const DbLive = (d1: D1Database) => DatabaseLiveFromBinding(d1);
