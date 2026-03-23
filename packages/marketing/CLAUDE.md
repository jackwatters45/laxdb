# @laxdb/marketing - Marketing Website

> **When to read:** Marketing site pages, blog posts, landing content.

TanStack Start marketing site. Deployed to Cloudflare Workers.

## CONTENT COLLECTIONS

Two collections using `@content-collections/core` with MDX:

**Blog posts** (`src/content/*.mdx`):

```yaml
---
title: "Post Title"
published: 2025-01-01
description: "Optional description"
authors: ["Author Name"]
---
```

**Changelog entries** (`src/content/changelog/*.mdx`):

```yaml
---
title: "Entry Title"
published: 2025-01-01
description: "Optional description"
---
```

**After adding/modifying content**: `bun run gen:content-collections`

## TAILWIND V4 BETA

Uses Tailwind CSS v4 beta with `@tailwindcss/postcss`. Syntax differs from v3:

- CSS-first configuration
- New color system

## ANTI-PATTERNS

| Pattern                  | Why Bad           | Do Instead             |
| ------------------------ | ----------------- | ---------------------- |
| Edit routeTree.gen.ts    | Auto-generated    | Let router generate it |
| Skip content-collections | MDX won't compile | Run after changes      |

## NOTES

- **Template origin**: Originally based on Tremor Solar template (since removed)
- **Domain**: Deployed to root domain (laxdb.io in prod)
- **Icons**: Uses @remixicon/react
- **Motion**: Uses motion (framer-motion) for animations
- **Shared UI**: Imports CSS tokens via `@laxdb/ui/globals.css` and select components (e.g. Logo) from `@laxdb/ui`. Marketing-specific components live locally.
