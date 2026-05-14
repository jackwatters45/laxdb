import {
  createRootRoute,
  HeadContent,
  Outlet,
  redirect,
  Scripts,
} from "@tanstack/react-router";

import { NotFound } from "../components/NotFound";
import { getMe } from "../lib/session";
import appCss from "../styles.css?url";

const PUBLIC_PATHS = ["/login", "/accept-invitation"];
const isPublic = (path: string) =>
  PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LaxDB Fines Fines" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  beforeLoad: async ({ location }) => {
    if (isPublic(location.pathname)) return { me: null };
    const me = await getMe();
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
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
