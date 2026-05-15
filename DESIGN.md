---
version: alpha
name: LaxDB
description: Lacrosse operating system for clubs, teams, practices, and player development.
colors:
  background: "#F6F3EA"
  foreground: "#262626"
  card: "#FFFFFF"
  muted: "#E8E4DA"
  muted-foreground: "#73716B"
  border: "#D8D2C4"
  primary: "#262626"
  primary-foreground: "#FAFAFA"
  accent: "#D56B2A"
  accent-foreground: "#1F1F1D"
  success: "#3A8F5C"
  warning: "#B87912"
  destructive: "#B8422E"
typography:
  h1:
    fontFamily: Newsreader
    fontSize: 4rem
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  h2:
    fontFamily: Newsreader
    fontSize: 2.5rem
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.035em"
  body:
    fontFamily: Helvetica Neue
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.55
  label-caps:
    fontFamily: Helvetica Neue
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: 12px
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.md}"
    padding: 12px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
---

## Overview

LaxDB should feel like a serious coaching notebook crossed with a modern operating console: tactile, editorial, sharp, and field-ready. The product serves lacrosse teams and clubs, so the interface should balance sideline speed with administrative confidence.

Use this file as the design-system contract for coding agents. Runtime CSS tokens remain in `packages/ui/src/globals.css`; keep this document aligned with that file whenever changing visual language.

## Colors

The palette is warm, grounded, and field-adjacent without becoming literal turf green. Prefer parchment backgrounds, deep ink text, restrained borders, and a single confident orange accent.

- **Background (#F6F3EA):** Warm paper surface for app chrome and marketing sections.
- **Foreground / Primary (#262626):** Deep charcoal for dense planning interfaces and editorial headlines.
- **Accent (#D56B2A):** Lacrosse-leather orange for important actions, highlights, and active states.
- **Muted (#E8E4DA):** Film-room beige for secondary panels, dividers, and inactive states.
- **Destructive (#B8422E):** Clay red for irreversible or high-risk actions only.

## Typography

Use `Newsreader` for high-impact editorial headings and moments that need character. Use `Helvetica Neue` for dense UI, controls, tables, and practice-planning workflows.

Headlines should feel compressed, confident, and slightly literary. Interface text should stay neutral and fast to scan.

## Layout

Favor practical coaching workflows over decorative symmetry. Good LaxDB screens should feel like a well-marked practice plan: clear zones, visible hierarchy, and enough asymmetry to avoid generic dashboard sameness.

- Use generous spacing on marketing pages.
- Use tighter, tool-like spacing in practice-planner surfaces.
- Preserve strong alignment for tables, rosters, drills, and schedule data.
- Avoid centered card stacks unless the task is truly linear.

## Elevation & Depth

Depth should be tactile but restrained. Prefer borders, subtle surface contrast, and slight shadows over glassmorphism or heavy blur. Planning surfaces can use layered panels, but the field/canvas should remain visually dominant.

## Shapes

Corners are modest and functional. Use small radii for controls, medium radii for cards, and avoid pill-shaped defaults unless representing tags, status, or compact metadata.

## Components

Buttons should be direct and utilitarian. Cards should read like coaching materials: structured, labeled, and easy to scan. Navigation should avoid anonymous SaaS chrome; use typography, active-state contrast, and domain language to make location obvious.

## Do's and Don'ts

Do:

- Keep `DESIGN.md` and `packages/ui/src/globals.css` semantically aligned.
- Prefer lacrosse-specific hierarchy and labels over generic dashboard patterns.
- Use accent color sparingly so it retains coaching significance.
- Validate this file with `bun run design:lint` after edits.

Don't:

- Duplicate CSS token definitions outside `packages/ui/src/globals.css`.
- Introduce Radix assumptions; UI components use Base UI patterns.
- Default to blue-gray SaaS palettes, Inter-only typography, or symmetric bento grids.
- Treat generated exports as the source of truth without reviewing the existing OKLCH token system.
