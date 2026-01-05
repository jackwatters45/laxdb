# @laxdb/docs - Documentation Site

Fumadocs-powered documentation site. TanStack Start + MDX. Deployed to Cloudflare Workers.

## STRUCTURE

```
content/
└── docs/              # MDX documentation files
src/
├── routes/
│   ├── __root.tsx     # Root layout
│   ├── index.tsx      # Docs homepage
│   ├── docs/$.tsx     # Catch-all docs route
│   └── api/search.ts  # Orama search endpoint
├── components/
│   ├── search.tsx     # Search component
│   └── not-found.tsx  # 404 component
├── lib/
│   ├── source.ts      # Fumadocs source loader
│   └── layout.shared.tsx  # Shared layout
└── styles/            # CSS styles
source.config.ts       # Fumadocs MDX config
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add docs page | `content/docs/{path}.mdx` |
| Modify docs layout | `src/lib/layout.shared.tsx` |
| Configure navigation | `content/docs/meta.json` |
| Add search | `src/routes/api/search.ts` (Orama) |
| Change source config | `source.config.ts` |

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

| Pattern | Why Bad | Do Instead |
|---------|---------|------------|
| Edit `.source/` | Auto-generated | Let fumadocs generate |
| Skip fumadocs-mdx | MDX imports break | Run before typecheck |
| Edit routeTree.gen.ts | Auto-generated | Let router generate |

## COMMANDS

```bash
bun run dev           # Dev server (port 3001)
bun run build         # Production build (runs fumadocs-mdx)
fumadocs-mdx          # Manually regenerate MDX types
```

## NOTES

- **Domain**: Deployed to docs.laxdb.io
- **Tailwind v4**: Uses @tailwindcss/vite plugin
- **Icons**: Uses lucide-static for sidebar icons
- **fumadocs-ui**: Provides pre-built UI components
- **Search**: Orama for client-side search
