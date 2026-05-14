# @laxdb/marketing - Marketing Website

> **When to read:** Marketing site pages, blog posts, landing content.

TanStack Start marketing site. Deployed to Cloudflare Workers.

## CONTENT COLLECTIONS

Two collections using `@content-collections/core`. Source files are Obsidian-compatible Markdown; compiled to MDX at build time.

**Vault root**: `src/content` can be opened directly as an Obsidian vault.

**Blog posts/wiki notes** (`src/content/*.md`):

```yaml
---
title: "Post Title"
published: 2025-01-01
description: "Optional description"
authors: ["Author Name"]
---
```

**Changelog entries** (`src/content/changelog/*.md`):

```yaml
---
title: "Entry Title"
published: 2025-01-01
description: "Optional description"
---
```

**After adding/modifying content**: `bun run gen:content-collections`

Obsidian syntax supported in content:

- `[[Page Name]]` → `/content/page-name`
- `[[Page Name|Custom Label]]` → custom link text
- `[[Page Name#Heading]]` → heading link
- `![[attachments/image.png]]` → `/content-assets/attachments/image.png`
- `> [!NOTE]` callouts render as Markdown blockquotes

Put Obsidian attachments under `src/content/attachments`. `bun run sync:content-assets` copies non-Markdown assets to `public/content-assets`. Any dot-prefixed file/folder in the content vault plus the symlinked `Templates` folder are ignored by git, linting, formatting, typechecking, content collections, prerendering, and asset sync.

## TAILWIND V4 BETA

Uses Tailwind CSS v4 beta with `@tailwindcss/postcss`. Syntax differs from v3:

- CSS-first configuration
- New color system

## ANTI-PATTERNS

| Pattern                  | Why Bad                       | Do Instead                                    |
| ------------------------ | ----------------------------- | --------------------------------------------- |
| Edit routeTree.gen.ts    | Auto-generated                | Let router generate it                        |
| Skip content-collections | Markdown won't compile        | Run after changes                             |
| Raw JSX in notes         | Breaks Obsidian compatibility | Use Markdown or compiler-supported shortcodes |

## NOTES

- **Template origin**: Originally based on Tremor Solar template (since removed)
- **Domain**: Deployed to root domain (laxdb.io in prod)
- **Icons**: Uses @remixicon/react
- **Motion**: Uses motion (framer-motion) for animations
- **Shared UI**: Imports CSS tokens via `@laxdb/ui/globals.css` and select components (e.g. Logo) from `@laxdb/ui`. Marketing-specific components live locally.
