# Practice Editor (`usePracticeEditor`)

> Architecture, known issues, and planned improvements for the graph editor's state management.

## Current Design

Single `PracticeGraph` state managed via `useState`. All mutations go through a wrapped `setPractice` that auto-pushes to an undo stack. Undo/redo stacks live in refs (no re-renders on stack changes).

**What's good:**
- Single source of truth — one `PracticeGraph`, all mutations funnel through `setPractice`
- Undo is transparent — callers don't think about it
- Immutable updates throughout (spread/map)
- Undo/redo stacks in refs avoids unnecessary re-renders

## Known Issues

### 1. ~~Drag Undo Granularity~~ ✅ Fixed

Solved via `updateNodeRaw` (bypasses undo during drag) and `commitDrag(nodeId, from, to)` (pushes a single undo entry with the pre-drag position on mouseup). One drag = one Cmd+Z.

### 2. Full Snapshot Undo Stack

Every edit clones the entire `PracticeGraph` onto the stack. Two concerns:

- **Memory** — 50 entries × full graph (all nodes + edges). Fine at current sizes, won't scale to very large practices.
- **No grouping** — can't say "these 5 mutations are one undo step" without combining them into a single monolithic updater. Currently handled by doing complex ops (like `addSplit`) in one `setPractice` call, but this forces every multi-step operation into a single function.

### 3. No Graph Validation

Nothing prevents invalid states:
- Edges pointing to nonexistent nodes
- Cycles in the main flow
- Orphaned nodes (disconnected from the graph)
- Duplicate edges

## Planned Improvements

### ~~Phase 1: Fix Drag Undo~~ ✅ Done

### Phase 2: Command Pattern

Replace snapshot-based undo with reversible commands. Standard pattern for editors (Figma, Photoshop, VS Code).

Instead of storing full graph copies, store operations:

```
Stack: [
  { type: 'moveNode', nodeId: 'x', from: {x:0, y:0}, to: {x:100, y:50} },
  { type: 'deleteNode', nodeId: 'y', snapshot: {node, edges} },
  { type: 'addSplit', createdIds: ['split-1', 'lane-1', 'lane-2'] },
]
```

Each command knows how to apply and reverse itself.

**Benefits:**
- A drag is one command, not 200 snapshots
- `beginGroup()` / `endGroup()` for multi-step operations
- Memory efficient — deltas, not full copies
- Better undo descriptions (could show "Undo: delete node" in UI)

**Trigger:** When adding bulk operations (multi-select delete, paste, template insertion) or when graphs get large.

### Phase 3: Graph Validation

Dev-mode invariant checks after each mutation:
- No dangling edge references
- No cycles in main flow (splits must rejoin)
- No orphaned subgraphs
- Edge source/target consistency
- No duplicate edges between the same pair
