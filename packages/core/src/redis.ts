import { Data, Effect } from 'effect';
import { Redis, type RedisOptions } from 'ioredis';

export class RedisError extends Data.TaggedError('RedisError')<{
  cause: unknown;
  msg: string;
}> {}

export class RedisService extends Effect.Service<RedisService>()(
  'RedisService',
  {
    effect: Effect.gen(function* () {
      const host = process.env.REDIS_HOST ?? 'localhost';
      const port = Number(process.env.REDIS_PORT ?? '6379');

      const redisConfig: RedisOptions & { host: string; port: number } = {
        host,
        port,
        ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
        ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
        ...(host !== 'localhost' && { tls: {} }),
      };

      const client = new Redis(redisConfig);

      return {
        get: Effect.fn('Redis:get')(function* (key: string) {
          return yield* Effect.tryPromise(() => client.get(key)).pipe(
            Effect.tapError(Effect.logError),
            Effect.mapError(
              (cause) =>
                new RedisError({ msg: `Failed to get key: ${key}`, cause })
            )
          );
        }),

        set: Effect.fn('Redis:set')(function* (
          key: string,
          value: string,
          ttlSeconds?: number
        ) {
          return yield* Effect.tryPromise(() => {
            if (ttlSeconds) {
              return client.set(key, value, 'EX', ttlSeconds);
            }
            return client.set(key, value);
          }).pipe(
            Effect.mapError(
              (cause) =>
                new RedisError({ msg: `Failed to set key: ${key}`, cause })
            ),
            Effect.asVoid
          );
        }),

        delete: Effect.fn('Redis:delete')(function* (key: string) {
          return yield* Effect.tryPromise(() => client.del(key)).pipe(
            Effect.mapError(
              (cause) =>
                new RedisError({
                  msg: `Failed to delete key: ${key}`,
                  cause,
                })
            ),
            Effect.asVoid
          );
        }),

        disconnect: Effect.fn('Redis:disconnect')(function* () {
          return yield* Effect.try({
            try: () => client.disconnect(),
            catch: (cause) =>
              new RedisError({ msg: 'Failed to disconnect Redis', cause }),
          });
        }),
      };
    }),
  }
) {}
