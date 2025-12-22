import { HttpLayerRouter } from '@effect/platform';
import { Context, Effect } from 'effect';

class CurrentSession extends Context.Tag('CurrentSession')<
  CurrentSession,
  {
    readonly token: string;
  }
>() {}

const SessionMiddleware = HttpLayerRouter.middleware<{
  provides: CurrentSession;
}>()(
  Effect.gen(function* () {
    yield* Effect.log('SessionMiddleware initialized');

    return (httpEffect) =>
      Effect.provideService(httpEffect, CurrentSession, {
        token: 'dummy-token',
      });
  })
);

// Here is a middleware that uses the `CurrentSession` service
const LogMiddleware = HttpLayerRouter.middleware(
  Effect.gen(function* () {
    yield* Effect.log('LogMiddleware initialized');

    return Effect.fn(function* (httpEffect) {
      const session = yield* CurrentSession;
      yield* Effect.log(`Current session token: ${session.token}`);
      return yield* httpEffect;
    });
  })
);

// We can then use the .combine method to combine the middlewares
export const LogAndSessionMiddleware = LogMiddleware.combine(SessionMiddleware);
