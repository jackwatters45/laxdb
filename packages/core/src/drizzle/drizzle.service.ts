import * as PgDrizzle from '@effect/sql-drizzle/Pg';
import { PgClient } from '@effect/sql-pg';
import { Cause, Console, Layer } from 'effect';
import { AppConfig } from '../config';

const PgLive = PgClient.layerConfig({
  url: AppConfig.databaseUrl,
}).pipe(
  Layer.tapErrorCause((cause) => Console.log(Cause.pretty(cause))),
  Layer.orDie
);

const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive));

export const DatabaseLive = Layer.mergeAll(PgLive, DrizzleLive);
