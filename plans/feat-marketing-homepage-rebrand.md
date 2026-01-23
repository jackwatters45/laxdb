# Marketing Homepage Rebrand: LaxTalk Style + Wikipedia Vibe

Rebrand marketing site from Solar/farm template to LaxDB with LaxTalk styling.

## Design Direction

**Target aesthetic:** LaxTalk meets Wikipedia - clean, content-focused, monochrome with serif accents. Simple but refined product feel.

### LaxTalk Style Analysis

| Element | LaxTalk Value | Apply To |
|---------|---------------|----------|
| **Font sans** | Helectiva (body), Inter (UI) | Body text, nav |
| **Font serif** | Newsreader (headings, italics) | H2, emphasis, section titles |
| **Background** | `--background: 0 0% 95%` (light gray #f2f2f2) | Page bg |
| **Foreground** | `--foreground: 0 0% 10%` (dark #1a1a1a) | Text |
| **Muted text** | `--muted-foreground: 0 0% 44%` (#707070) | Secondary text |
| **Accent** | `--accent: 0 0% 88%` (light gray) | Subtle highlights |
| **Border** | `#e8e8e8` | Dividers, cards |
| **Typography** | 16px/28px line-height | Comfortable reading |
| **Max-width** | `max-w-screen-sm` (640px content) | Content column |
| **Scrollbar** | Thin, styled | Global |

### Key Style Principles

1. **Monochrome palette** - No orange, no color accents. Pure grayscale.
2. **Serif for emphasis** - Newsreader italic for headings/callouts
3. **Content-first** - Tight max-width, generous line-height
4. **Minimal chrome** - Simple nav, minimal footer, no flashy animations
5. **Dark mode support** - Invert grays appropriately

## Implementation

### Phase 1: Styling Foundation

**File: `packages/marketing/src/globals.css`**

Update to LaxTalk-inspired Tailwind v4 theme:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* LaxTalk-inspired monochrome palette */
  --color-background: hsl(0 0% 95%);
  --color-foreground: hsl(0 0% 10%);
  --color-muted: hsl(0 0% 44%);
  --color-accent: hsl(0 0% 88%);
  --color-border: #e8e8e8;

  /* Dark mode overrides */
  --color-background-dark: hsl(0 0% 10%);
  --color-foreground-dark: hsl(0 0% 90%);
  --color-muted-dark: hsl(0 0% 63%);
  --color-accent-dark: hsl(0 0% 15%);
  --color-border-dark: #2e2e2e;

  /* Typography */
  --font-sans: "Helvetica", -apple-system, sans-serif;
  --font-serif: "Newsreader", "Times", serif;
  --font-ui: "Inter", -apple-system, sans-serif;

  /* Spacing */
  --leading: 28px;
  --text: 16px;
}

@layer base {
  html {
    scrollbar-gutter: stable;
    scrollbar-width: thin;
  }

  body {
    @apply bg-background text-foreground;
    font-size: var(--text);
    line-height: var(--leading);
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  h2 {
    font-family: var(--font-serif);
    font-style: italic;
  }

  em, i {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: calc(1rem + 1px);
  }
}
```

### Phase 2: Site Config

**File: `packages/marketing/src/site.ts`**

```ts
export const siteConfig = {
  name: "LaxDB",
  url: "https://laxdb.io",
  description: "The complete lacrosse data platform. Pro league stats, player analytics, and historical data.",
  baseLinks: {
    home: "/",
  },
};
```

### Phase 3: Logo

**File: `packages/marketing/public/laxdb-logo.tsx`** (exists, update if needed)

Keep existing LaxDBLogo and LaxDBMark, but update to use `currentColor` for theme compatibility.

### Phase 4: Navbar (Simplify)

**File: `packages/marketing/src/components/ui/navbar.tsx`**

Simplify to LaxTalk style:
- Fixed position, solid background
- Text-based title (no logo icon on desktop)
- Simple links: Contents, Wiki, Graph
- Inter font for UI elements

```tsx
<header class="fixed z-50 w-full max-w-6xl bg-background font-ui">
  <nav class="h-14 flex items-center justify-between px-4">
    <Link to="/" class="text-lg font-medium">LaxDB</Link>
    <div class="flex items-center gap-6 text-sm">
      <Link to="/blog" class="hover:underline">Blog</Link>
      <Link to="/wiki" class="hover:underline">Wiki</Link>
      <Link to="/graph" class="hover:underline">Graph</Link>
    </div>
  </nav>
</header>
```

### Phase 5: Footer (Simplify)

**File: `packages/marketing/src/components/ui/footer.tsx`**

Minimal LaxTalk-style footer:

```tsx
<footer class="h-12 border-t border-border w-full text-sm text-muted font-ui">
  <div class="mx-auto h-full max-w-6xl flex items-center justify-between px-4">
    <div class="flex items-center gap-6">
      <Link to="/about" class="hover:underline">About</Link>
      <a href="https://github.com/jackwatters45/laxdb" class="hover:underline">GitHub</a>
    </div>
    <span>{new Date().getFullYear()} LaxDB</span>
  </div>
</footer>
```

### Phase 6: Hero (Content-Focused)

**File: `packages/marketing/src/components/ui/hero.tsx`**

Wikipedia/LaxTalk vibe - text-focused, minimal decoration:

```tsx
<section class="mx-auto max-w-3xl px-4 pt-32 pb-16">
  <h1 class="text-4xl md:text-5xl font-serif italic tracking-tight">
    The Lacrosse Data Platform
  </h1>
  <p class="mt-6 text-lg text-muted leading-relaxed max-w-2xl">
    Comprehensive statistics and analytics for professional lacrosse.
    PLL, NLL, MLL, MSL, WLA - all in one place.
  </p>
  <div class="mt-8 flex gap-4">
    <Link to="/wiki" class="underline font-medium">Browse Wiki →</Link>
    <Link to="/graph" class="underline font-medium">Explore Graph →</Link>
  </div>
</section>
```

### Phase 7: Features → Data Overview

**File: `packages/marketing/src/components/ui/features.tsx`**

Replace farm features with lacrosse data overview. Simple list/grid format:

```tsx
<section class="mx-auto max-w-3xl px-4 py-16 border-t border-border">
  <h2 class="text-xl font-serif italic mb-8">What's Inside</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div>
      <h3 class="font-medium">Pro League Data</h3>
      <p class="text-muted text-sm mt-1">
        PLL, NLL, MLL, MSL, WLA statistics from 2000 to present.
      </p>
    </div>
    <div>
      <h3 class="font-medium">Player Profiles</h3>
      <p class="text-muted text-sm mt-1">
        Career stats, team history, and cross-league tracking.
      </p>
    </div>
    <div>
      <h3 class="font-medium">Historical Archive</h3>
      <p class="text-muted text-sm mt-1">
        Game results, standings, and play-by-play data.
      </p>
    </div>
    <div>
      <h3 class="font-medium">Knowledge Graph</h3>
      <p class="text-muted text-sm mt-1">
        Interactive visualization of relationships and connections.
      </p>
    </div>
  </div>
</section>
```

### Phase 8: Remove/Simplify Sections

**Remove entirely:**
- `testimonial.tsx` - No testimonial content available
- `map/map.tsx` - Not relevant to LaxDB
- `call-to-action.tsx` - Replace with simple footer CTA
- `solar-analytics.tsx` - Farm-specific
- `analytics-illustration.tsx` - Farm data

**Keep but simplify:**
- Hero → Text-focused as above
- Features → Data overview as above

### Phase 9: Homepage Route

**File: `packages/marketing/src/routes/index.tsx`**

Simplified structure:

```tsx
function Home() {
  return (
    <main class="min-h-screen">
      <Hero />
      <Features />
      {/* Optional: Recent blog posts preview */}
    </main>
  );
}
```

### Phase 10: Root Layout Updates

**File: `packages/marketing/src/routes/__root.tsx`**

- Remove orange selection colors
- Update meta keywords
- Add dark mode toggle support

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/globals.css` | Modify | LaxTalk theme variables |
| `src/site.ts` | Modify | LaxDB name/description |
| `src/components/ui/navbar.tsx` | Modify | Simplify, LaxTalk style |
| `src/components/ui/footer.tsx` | Modify | Minimal 2-column |
| `src/components/ui/hero.tsx` | Modify | Text-focused, no decoration |
| `src/components/ui/features.tsx` | Modify | Data overview grid |
| `src/routes/index.tsx` | Modify | Remove farm sections |
| `src/routes/__root.tsx` | Modify | Theme colors, meta |
| `public/laxdb-logo.tsx` | Modify | Use currentColor |

## Files to Delete

| File | Reason |
|------|--------|
| `src/components/ui/testimonial.tsx` | No content |
| `src/components/ui/map/` | Not relevant |
| `src/components/ui/call-to-action.tsx` | Not needed |
| `src/components/ui/solar-analytics.tsx` | Farm-specific |
| `src/components/ui/analytics-illustration.tsx` | Farm data |
| `public/solar-logo.tsx` | Replaced by laxdb-logo |
| `public/solar-mark.tsx` | Replaced by laxdb-logo |
| `public/images/farm-*.webp` | Farm imagery |
| `public/images/field.png` | Farm imagery |
| `public/images/drone*.png` | Farm imagery |
| `public/images/smiller.jpeg` | Fake testimonial |

## Acceptance Criteria

- [ ] Monochrome color scheme (no orange)
- [ ] Newsreader serif for headings/emphasis
- [ ] Simplified nav (text-based, no complex logo)
- [ ] Minimal footer (2 sections max)
- [ ] Hero with clear value proposition
- [ ] Features section showing LaxDB data types
- [ ] All farm/Solar references removed
- [ ] Dark mode toggle works
- [ ] Verify in browser using visual-feedback

## Open Questions

1. **Fonts**: Should we self-host Newsreader and Inter or use Google Fonts?
2. **Blog styling**: Should blog posts also get LaxTalk treatment?
3. **Graph page**: Keep as-is or integrate new styling?
4. **Dark mode**: Priority or defer?
