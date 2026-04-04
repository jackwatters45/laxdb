/// <reference types="vite/client" />

import { ThemeProvider } from "@laxdb/ui/components/theme-provider";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import globalsCss from "@/globals.css?url";
import { siteConfig } from "@/site";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Page not found</p>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: siteConfig.name },
      { name: "description", content: siteConfig.description },
      { property: "og:type", content: "website" },
      { property: "og:title", content: siteConfig.name },
      { property: "og:description", content: siteConfig.description },
    ],
    links: [{ rel: "stylesheet", href: globalsCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AppShell>
              <Outlet />
            </AppShell>
          </ThemeProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
