import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
  Scripts,
} from "@tanstack/react-router";

import { NotFound } from "../components/not-found";
import { getMe, ME_QUERY_KEY, ME_STALE_TIME_MS } from "../lib/session";
import appCss from "../styles.css?url";

const PUBLIC_PATHS = ["/login", "/accept-invitation"];
const isPublic = (path: string) =>
  PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Malvern Lacrosse" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  beforeLoad: async ({ context, location }) => {
    if (isPublic(location.pathname)) return { me: null };
    const me = await context.queryClient.ensureQueryData({
      queryKey: ME_QUERY_KEY,
      queryFn: () => getMe(),
      staleTime: ME_STALE_TIME_MS,
    });
    if (!me) throw redirect({ to: "/login" });
    if (!me.activeOrganizationId && location.pathname !== "/onboarding") {
      throw redirect({ to: "/onboarding" });
    }
    return { me };
  },
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
