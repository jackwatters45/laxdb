# practice-planner

> Visual practice planning tool for lacrosse coaches. Standalone Cloudflare Worker deployed to planner.laxdb.io.

## Stack

- **Framework**: TanStack Start (React 19)
- **Styling**: Tailwind v4 via `@tailwindcss/vite`
- **Deployment**: Cloudflare Workers via Alchemy
- **UI Components**: Consume from `@laxdb/ui` (includes `cn`, `motion`)

## Key Patterns

- **No duplicate deps**: Utilities (`cn`, `clsx`, `tailwind-merge`) come from `@laxdb/ui`. Don't add them as direct dependencies.
- **Icon version alignment**: `lucide-react` version must match `@laxdb/ui` to avoid duplicate bundles.
- **CSS tokens**: Import via `@import "@laxdb/ui/globals.css"` in `globals.css`.
- **Mock data**: `src/data/mock-drills.ts` is temporary — will be replaced by API-backed drill service.
- **Route tree**: `routeTree.gen.ts` is auto-generated. Never edit manually, always commit changes.

## Architecture

- `src/components/canvas.tsx` — pan/zoom canvas with dot-grid background
- `src/components/workflow-node.tsx` — renders practice blocks (start, split, default variants)
- `src/components/workflow-edge.tsx` — SVG edges between nodes
- `src/components/config-panel.tsx` — right sidebar for editing selected node
- `src/components/drill-sidebar.tsx` — left sidebar for browsing drill library
- `src/lib/layout.ts` — topological sort auto-layout algorithm
- `src/lib/quick-plan.ts` — generates practice plans from drill library
- `src/lib/node-geometry.ts` — node sizing/positioning by variant

## Data Model

- `Drill` — template drills that can be added to a practice
- `PracticeNode` — items in the practice workflow (warmup, drill, cooldown, etc.)
- `PracticeEdge` — connections between nodes
- `Practice` — a complete practice plan with nodes and edges

## Commands

```bash
bun run dev          # Dev server on port 3004
bun run build        # Production build
bun run typecheck    # Type check
bun run fix          # Lint + format
```
