# feat: Clickable Tag Pages

## Overview

Add dynamic tag pages at `/tag/$tagId` and make all tag pills clickable across the site. Also introduce an `ai` tag for AI-generated content.

## Problem Statement

Tags are displayed on content pages but are not interactive. Users cannot:
- Click a tag to see all related content
- Discover content by browsing tags
- Distinguish AI-generated content from human-written

## Proposed Solution

1. Create `/tag/$tagId` route showing all posts with that tag
2. Convert tag `<span>` elements to `<Link>` components
3. Add `ai` tag to AI-generated content with visual distinction

## Technical Approach

### Route Structure

```
/tag/$tagId    # New - shows all content with tag
```

**Exclude routing tags from tag pages** (blog, wiki, opinion) - these already have dedicated routes.

### Files to Create

#### `src/routes/tag/$tagId.tsx`

```tsx
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { allPosts } from "content-collections";

const ROUTING_TAGS = new Set(["blog", "wiki", "opinion"]);

export const Route = createFileRoute("/tag/$tagId")({
  loader: ({ params }) => {
    const { tagId } = params;

    // Redirect routing tags to their dedicated pages
    if (ROUTING_TAGS.has(tagId)) {
      throw notFound(); // Or redirect to /blog, /wiki, etc.
    }

    const posts = allPosts.filter((p) => p.tags?.includes(tagId));
    if (posts.length === 0) throw notFound();

    return { tagId, posts };
  },
  component: TagPage,
});
```

### Files to Modify

#### `src/routes/content/$slug.tsx` (lines 43-54)

Replace static spans with Links:

```tsx
// Before
<span className="rounded-full bg-blog-border/50 px-2 py-0.5 text-xs text-blog-subtle">
  {tag}
</span>

// After
<Link
  to="/tag/$tagId"
  params={{ tagId: tag }}
  className="rounded-full bg-blog-border/50 px-2 py-0.5 text-xs text-blog-subtle hover:bg-blog-border hover:text-blog-fg transition-colors"
>
  {tag}
</Link>
```

#### Content files - add `ai` tag

For AI-generated content, add to frontmatter:
```yaml
tags:
  - wiki
  - player
  - ai
```

### AI Tag Visual Treatment

Option A: Different color for `ai` tag pill
```tsx
const isAiTag = tag === "ai";
<Link
  className={cn(
    "rounded-full px-2 py-0.5 text-xs transition-colors",
    isAiTag
      ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
      : "bg-blog-border/50 text-blog-subtle hover:bg-blog-border"
  )}
>
```

Option B: Add icon/emoji prefix
```tsx
{tag === "ai" ? "🤖 ai" : tag}
```

## Acceptance Criteria

- [ ] `/tag/pll` shows all posts tagged with `pll`
- [ ] `/tag/blog` returns 404 (routing tag excluded)
- [ ] Clicking tag on `/content/ryan-boyle` navigates to `/tag/player`
- [ ] AI-generated content has `ai` tag in frontmatter
- [ ] `ai` tag has distinct visual style
- [ ] Verify in browser using visual-feedback

## Tag Taxonomy Reference

| Category | Tags | Behavior |
|----------|------|----------|
| Routing | `blog`, `wiki`, `opinion` | Excluded from /tag/ - have dedicated routes |
| Subject | `player`, `team`, `league`, `skill`, `media`, `event` | Clickable → /tag/$tagId |
| Topic | `pll`, `nll`, `industry` | Clickable → /tag/$tagId |
| Meta | `ai`, `featured` | Clickable, special styling |

## Dependencies

- Existing `getContentByTag()` in graph-utils.ts
- TanStack Router dynamic params (already used in /content/$slug)

## References

- Existing pattern: `src/routes/content/$slug.tsx`
- Tag filtering: `src/lib/graph-utils.ts:102-104`
- Tag display: `src/routes/content/$slug.tsx:43-54`
