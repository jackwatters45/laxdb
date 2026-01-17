# @laxdb/marketing - Marketing Website

> **When to read:** Marketing site pages, blog posts, landing content.

TanStack Start marketing site. Based on Tremor Solar template. Deployed to Cloudflare Workers.

## STRUCTURE

```
src/
├── routes/
│   ├── __root.tsx        # Root layout (NavBar, Footer)
│   ├── index.tsx         # Homepage
│   └── blog/             # Blog routes
│       ├── index.tsx     # Blog listing
│       └── $slug.tsx     # Individual posts
├── components/
│   ├── ui/               # Marketing UI (hero, features, pricing)
│   └── *.tsx             # Shared (button, icons, nav)
├── content/              # MDX blog posts
├── lib/                  # Utilities
├── site.ts               # Site config (name, url, description)
└── globals.css           # Tailwind styles
```

## WHERE TO LOOK

| Task                  | Location                                     |
| --------------------- | -------------------------------------------- |
| Edit homepage         | `src/routes/index.tsx`                       |
| Add blog post         | `src/content/{slug}.mdx`                     |
| Modify navbar/footer  | `src/components/ui/navbar.tsx`, `footer.tsx` |
| Add marketing section | `src/components/ui/`                         |
| Change site metadata  | `src/site.ts`                                |

## BLOG POSTS

Blog uses `@content-collections/core` with MDX:

```yaml
---
title: "Post Title"
published: 2025-01-01
description: "Optional description"
authors: ["Author Name"]
---
```

**After adding/modifying posts**: `bun run gen:content-collections`

## TAILWIND V4 BETA

Uses Tailwind CSS v4 beta with `@tailwindcss/postcss`. Syntax differs from v3:

- CSS-first configuration
- New color system

## ANTI-PATTERNS

| Pattern                  | Why Bad                | Do Instead             |
| ------------------------ | ---------------------- | ---------------------- |
| Edit routeTree.gen.ts    | Auto-generated         | Let router generate it |
| Skip content-collections | MDX won't compile      | Run after changes      |
| Use @laxdb/ui            | Separate design system | Use local components   |

## COMMANDS

```bash
bun run dev                       # Dev server (port 3002)
bun run gen:content-collections   # Rebuild blog content
bun run build                     # Production build
```

## NOTES

- **Template origin**: Based on Tremor Solar template
- **Domain**: Deployed to root domain (laxdb.io in prod)
- **Icons**: Uses @remixicon/react
- **Motion**: Uses motion (framer-motion) for animations
- **No shared UI**: Has own components, doesn't use @laxdb/ui
