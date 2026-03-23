# @laxdb/practice-planner - Practice Planning UI

> **When to read:** Working on the visual practice planner canvas.

Standalone TanStack Start + Tailwind v4 app. Deployed to `planner.laxdb.io`.

## STRUCTURE

```
src/
├── components/
│   ├── canvas.tsx           # Pannable/zoomable canvas with dot-grid background
│   ├── canvas-controls.tsx  # Bottom toolbar (pointer/pan, zoom, fit, organize)
│   ├── workflow-node.tsx    # Node cards (start, split, default variants)
│   ├── workflow-edge.tsx    # SVG bezier edges with arrowheads
│   ├── config-panel.tsx     # Right panel: edit node properties
│   ├── drill-sidebar.tsx    # Left panel: drill library with search/filter
│   ├── add-node-button.tsx  # "+" insert button between nodes
│   ├── split-node.tsx       # Group split modal (parallel lanes)
│   └── quick-plan-modal.tsx # Auto-generate practice from drill library
├── data/
│   ├── types.ts             # PracticeNode, PracticeEdge, Practice types
│   ├── mock-drills.ts       # 16 sample drills across categories
│   └── sample-practice.ts   # Pre-built example practice
├── lib/
│   ├── layout.ts            # Auto-layout (topological sort + layers)
│   ├── node-geometry.ts     # Node dimensions + edge anchor calculation
│   └── quick-plan.ts        # Practice generation algorithm
├── routes/
│   └── index.tsx            # Main page (state management, composition)
└── globals.css              # SVG position fix override
```

## KEY TYPES

- `PracticeNode.variant`: `"start" | "split" | "default"` — determines visual rendering
- `PracticeNode.type`: `PracticeItemType` — warmup, drill, cooldown, water-break, activity
- Node IDs use `crypto.randomUUID()` for SSR/HMR safety

## COMMANDS

```bash
bun run dev          # Dev server
bun run typecheck    # Type check
bun run fix          # Lint + format
```

## SEE ALSO

- `TODO.md` — Known improvements (magic offsets, edge label width, etc.)
