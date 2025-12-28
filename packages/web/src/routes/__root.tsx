/// <reference types="vite/client" />

import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type * as React from "react";
import { DefaultCatchBoundary } from "@/components/default-catch-boundary";
import { NotFound } from "@/components/not-found";
import { ThemeProvider } from "@laxdb/ui/components/theme-provider";
import { Toaster } from "@laxdb/ui/components/ui/sonner";
import globalsCss from "@/globals.css?url";
import { seo } from "@/lib/seo";

const TanStackDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-devtools").then((mod) => ({
          default: mod.TanStackDevtools,
        })),
      );

const ReactQueryDevtoolsPanel =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-query-devtools").then((mod) => ({
          default: mod.ReactQueryDevtoolsPanel,
        })),
      );

const TanStackRouterDevtoolsPanel =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-router-devtools").then((mod) => ({
          default: mod.TanStackRouterDevtoolsPanel,
        })),
      );

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "LaxDB",
        description:
          "TanStack Start is a type-safe, client-first, full-stack React framework. ",
      }),
    ],
    links: [
      { rel: "stylesheet", href: globalsCss },
      // {
      //   rel: 'apple-touch-icon',
      //   sizes: '180x180',
      //   href: '/apple-touch-icon.png',
      // },
      // {
      //   rel: 'icon',
      //   type: 'image/png',
      //   sizes: '32x32',
      //   href: '/favicon-32x32.png',
      // },
      // {
      //   rel: 'icon',
      //   type: 'image/png',
      //   sizes: '16x16',
      //   href: '/favicon-16x16.png',
      // },
      // { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      // { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="laxdb-ui-theme">
      <RootDocument>
        <Outlet />
        <Toaster />
      </RootDocument>
    </ThemeProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Suspense>
          <TanStackDevtools
            config={{ position: "bottom-right" }}
            plugins={[
              {
                name: "Tanstack Router",
                render: (
                  <Suspense>
                    <TanStackRouterDevtoolsPanel />
                  </Suspense>
                ),
              },
              {
                name: "Tanstack Query",
                render: (
                  <Suspense>
                    <ReactQueryDevtoolsPanel />
                  </Suspense>
                ),
              },
            ]}
          />
        </Suspense>
        <Scripts />
      </body>
    </html>
  );
}
