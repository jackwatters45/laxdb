import { createRouter as createTanstackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { DefaultCatchBoundary } from './components/default-catch-boundary';
import { NotFound } from './components/not-found';
import * as TanstackQuery from './lib/router-provider';
import { getContext } from './lib/router-provider';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const ctx = getContext();

  const router = createTanstackRouter({
    routeTree,
    context: { ...ctx },
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    Wrap: (props: { children: React.ReactNode }) => (
      <TanstackQuery.Provider {...ctx}>{props.children}</TanstackQuery.Provider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: ctx.queryClient,
  });

  return router;
}

declare module '@tanstack/react-router' {
interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
