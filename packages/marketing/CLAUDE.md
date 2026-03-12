# @laxdb/marketing - Marketing Website

> **When to read:** Marketing site pages, blog posts, landing content.

TanStack Start marketing site. Deployed to Cloudflare Workers.

## STRUCTURE

```
src/
├── routes/
│   ├── __root.tsx        # Root layout (NavBar, Footer)
│   ├── index.tsx         # Homepage
│   ├── about.tsx         # About page
│   ├── brand.tsx         # Brand page
│   ├── changelog.tsx     # Changelog page
│   ├── design-system.tsx # Design system page
│   ├── feedback.tsx      # Feedback page
│   ├── kitchen-sink.tsx  # Component showcase
│   ├── blog/             # Blog routes
│   ├── graph/            # Knowledge graph routes
│   ├── tag/              # Tag routes
│   └── wiki/             # Wiki routes
├── components/
│   ├── navbar.tsx        # Site navigation
│   ├── footer.tsx        # Site footer
│   ├── icons.tsx         # Icon components
│   ├── ui/               # Marketing-specific UI (hero, features)
│   └── *.tsx             # Other shared components
├── content/              # MDX blog posts
├── content/changelog/    # MDX changelog entries
├── lib/                  # Utilities
├── site.ts               # Site config (name, url, description)
└── globals.css           # Tailwind styles (imports @laxdb/ui/globals.css)
```

## WHERE TO LOOK

| Task                  | Location                                |
| --------------------- | --------------------------------------- |
| Edit homepage         | `src/routes/index.tsx`                  |
| Add blog post         | `src/content/{slug}.mdx`               |
| Add changelog entry   | `src/content/changelog/{slug}.mdx`      |
| Modify navbar/footer  | `src/components/navbar.tsx`, `footer.tsx`|
| Add marketing section | `src/components/ui/`                    |
| Change site metadata  | `src/site.ts`                           |

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

| Pattern                  | Why Bad                | Do Instead             |
| ------------------------ | ---------------------- | ---------------------- |
| Edit routeTree.gen.ts    | Auto-generated         | Let router generate it |
| Skip content-collections | MDX won't compile      | Run after changes      |

## COMMANDS

```bash
bun run dev                       # Dev server (port 3002)
bun run gen:content-collections   # Rebuild blog content
bun run build                     # Production build
```

## NOTES

- **Template origin**: Originally based on Tremor Solar template (since removed)
- **Domain**: Deployed to root domain (laxdb.io in prod)
- **Icons**: Uses @remixicon/react
- **Motion**: Uses motion (framer-motion) for animations
- **Shared UI**: Imports CSS tokens via `@laxdb/ui/globals.css` and select components (e.g. Logo) from `@laxdb/ui`. Marketing-specific components live locally.
