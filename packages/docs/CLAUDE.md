# @laxdb/docs - Documentation Site

> **When to read:** Adding/editing docs pages, Fumadocs config.

Fumadocs-powered documentation site. TanStack Start + MDX. Deployed to Cloudflare Workers.

## ADDING DOCS

**Page structure:**

```mdx
---
title: Page Title
description: Page description
---

# Content here
```

**Navigation via meta.json:**

```json
{
  "pages": ["index", "getting-started", "..."]
}
```

## BUILD PROCESS

`fumadocs-mdx` runs at:

- `postinstall` (auto)
- `typecheck` (before tsgo)

Generates type-safe imports from MDX content.

## ANTI-PATTERNS

| Pattern               | Why Bad           | Do Instead            |
| --------------------- | ----------------- | --------------------- |
| Edit `.source/`       | Auto-generated    | Let fumadocs generate |
| Skip fumadocs-mdx     | MDX imports break | Run before typecheck  |
| Edit routeTree.gen.ts | Auto-generated    | Let router generate   |

## NOTES

- **Domain**: Deployed to docs.laxdb.io
- **Tailwind v4**: Uses @tailwindcss/vite plugin
- **Icons**: Uses lucide-static for sidebar icons
- **fumadocs-ui**: Provides pre-built UI components
- **Search**: Orama for client-side search
