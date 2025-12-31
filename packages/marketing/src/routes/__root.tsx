/// <reference types="vite/client" />

import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import Footer from "@/components/ui/footer";
import { NavBar } from "@/components/ui/navbar";
import { siteConfig } from "@/site";
import globalsCss from "@/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: siteConfig.name },
      { name: "description", content: siteConfig.description },
      { name: "keywords", content: "Marketing, Database, Software" },
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
      { rel: "icon", href: "/favicon.ico" },
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
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen overflow-x-hidden scroll-auto bg-gray-50 antialiased selection:bg-orange-100 selection:text-orange-600">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundComponent() {
  return (
    <RootDocument>
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="mt-6 text-4xl font-semibold text-amber-600 sm:text-5xl">
          Error 404
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
      </div>
    </RootDocument>
  );
}
