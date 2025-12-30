# @laxdb/marketing - Marketing Website

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
│   ├── ui/               # Marketing UI components (hero, features, etc.)
│   └── *.tsx             # Shared components (button, icons, etc.)
├── content/              # MDX blog posts
├── lib/                  # Utilities (utils.ts, use-scroll.ts)
├── site.ts               # Site config (name, url, description)
└── globals.css           # Tailwind styles
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Edit homepage | `src/routes/index.tsx` |
| Add blog post | `src/content/{slug}.mdx` |
| Modify navbar/footer | `src/components/ui/navbar.tsx`, `footer.tsx` |
| Add marketing section | `src/components/ui/` |
| Change site metadata | `src/site.ts` |

## CONVENTIONS

### Content Collections (Blog)

Blog posts use `@content-collections/core` with MDX:

```
src/content/
└── my-post.mdx
```

**Frontmatter schema:**
```yaml
---
title: "Post Title"
published: 2025-01-01
description: "Optional description"
authors: ["Author Name"]
---
```

Run `bun run gen:content-collections` after adding posts.

### Tailwind v4 Beta

Uses Tailwind CSS v4 beta with `@tailwindcss/postcss`. Syntax differs from v3:
- CSS-first configuration
- New color system

### Motion Animations

Uses `motion` (framer-motion) for animations. See existing components for patterns.

## ANTI-PATTERNS

- **Edit routeTree.gen.ts**: Auto-generated, don't modify
- **Skip content-collections build**: Run after MDX changes

## COMMANDS

```bash
bun run dev                       # Dev server on port 3002
bun run gen:content-collections   # Rebuild blog content
bun run build                     # Production build
```

## NOTES

- **Template origin**: Based on Tremor Solar template
- **Domain**: Deployed to root domain (laxdb.io in prod)
- **Icons**: Uses @remixicon/react
- **No shared UI**: Has own components, doesn't use @laxdb/ui
