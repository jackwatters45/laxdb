import { AuthService } from '@laxdb/core/auth';
import { RuntimeServer } from '@laxdb/core/runtime.server';
import { redirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { Effect } from 'effect';

export const authMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next }) =>
  RuntimeServer.runPromise(
    Effect.gen(function* () {
      const auth = yield* AuthService;
      const request = getRequest();
      const { headers } = request;

      const session = yield* Effect.promise(() =>
        auth.auth.api.getSession({ headers })
      );

      if (!session) {
        const url = new URL(request.url);
        throw redirect({
          to: '/login',
          search: {
            redirectUrl: url.pathname,
          },
        });
      }

      return next({
        context: {
          session,
          headers,
        },
      });
    })
  )
);

const preLogMiddleware = createMiddleware({ type: 'function' })
  .client(async (ctx) => {
    const clientTime = new Date();

    return ctx.next({
      context: {
        clientTime,
      },
      sendContext: {
        clientTime,
      },
    });
  })
  .server(async (ctx) => {
    const serverTime = new Date();

    return ctx.next({
      sendContext: {
        serverTime,
        durationToServer:
          serverTime.getTime() - ctx.context.clientTime.getTime(),
      },
    });
  });

export const logMiddleware = createMiddleware({ type: 'function' })
  .middleware([preLogMiddleware])
  .client(async (ctx) => {
    const res = await ctx.next();

    const _now = new Date();

    return res;
  });
