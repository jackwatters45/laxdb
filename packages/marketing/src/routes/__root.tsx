/// <reference types="vite/client" />

import { NotFound } from "@laxdb/ui/components/not-found";
import { ThemeProvider } from "@laxdb/ui/components/theme-provider";
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";

import Footer from "@/components/ui/footer";
import { NavBar } from "@/components/ui/navbar";
import globalsCss from "@/globals.css?url";
import { siteConfig } from "@/site";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: siteConfig.name },
      { name: "description", content: siteConfig.description },
      { name: "keywords", content: "Lacrosse, Statistics, PLL, NLL, Analytics, Database" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: siteConfig.url },
      { property: "og:title", content: siteConfig.name },
      { property: "og:description", content: siteConfig.description },
      { property: "og:site_name", content: siteConfig.name },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: siteConfig.name },
      { name: "twitter:description", content: siteConfig.description },
    ],
    links: [
      { rel: "stylesheet", href: globalsCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <NavBar />
      <Outlet />
      <Footer />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen overflow-x-hidden scroll-auto bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundComponent() {
  return (
    <RootDocument>
      <NavBar />
      <NotFound>
        <Link
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border-b-[1.5px] border-foreground/20 bg-foreground px-5 py-3 text-sm leading-4 font-medium tracking-wide text-background shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(255,255,255,0.19)] transition-all duration-200 hover:opacity-90"
          to="/"
        >
          Go Home
        </Link>
      </NotFound>
      <Footer />
    </RootDocument>
  );
}
