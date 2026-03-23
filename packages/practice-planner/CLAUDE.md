# @laxdb/practice-planner - Practice Planning UI

> **When to read:** Working on the visual practice planner canvas.

Standalone TanStack Start + Tailwind v4 app. Deployed to `planner.laxdb.io`.

## KEY TYPES

- `PracticeNode.variant`: `"start" | "split" | "default"` — determines visual rendering
- `PracticeNode.type`: `PracticeItemType` — warmup, drill, cooldown, water-break, activity
- Node IDs use `crypto.randomUUID()` for SSR/HMR safety

## SEE ALSO

- `TODO.md` — Known improvements (magic offsets, edge label width, etc.)
