# State Machine Opportunities

> Where XState (or state machine patterns) would improve the practice planner and broader app.

## Implemented

### Canvas Interactions (`useCanvasInteractions`) ✅

Refactored from boolean soup to an XState machine with explicit states:

```
idle → panning         (mousedown on canvas)
idle → dragIntent      (mousedown on node)
dragIntent → dragging  (mousemove past threshold)
dragIntent → idle      (mouseup without move = click to select)
dragging → idle        (mouseup, commits undo)
panning → idle         (mouseup / mouseleave)
```

Impossible states (e.g. `isPanning && isDragging`) are now structurally impossible. Adding new interaction modes (multi-select, lasso, edge drawing) means adding new states to the machine — no boolean coordination needed.

Also fixed drag undo: `onDragNode` bypasses the undo stack during the drag, `onDragEnd` commits a single undo entry when the drag finishes.

## Remaining Implicit State Machines

### Autosave / Persistence (`usePracticePersistence`)

Current: simple debounce → save with a `saving` boolean. No error handling, no conflict detection.

Future needs:

```
clean → dirty → debouncing → saving → saved
                                ↓
                           save-failed → retrying → saved
                                                      ↓
                                                   conflict → resolving
```

Open questions: What if the user edits while a save is in flight? What if save fails — retry with backoff? Navigate away with unsaved changes? Server-side conflicts? XState's `invoke` and delayed transitions model this naturally.

### Right Panel Mode

`selectedNodeId` and `settingsOpen` are coordinated manually to enforce mutual exclusivity:

```
closed → node-config    (select a node)
closed → settings       (click settings)
node-config → settings  (click settings, clears selection)
settings → node-config  (select a node, closes settings)
* → closed              (close/deselect)
```

Worth a state machine if more panel modes are added (share settings, template picker, AI suggestions). Overkill if it stays at two modes.

## Future Flows (Not Built Yet)

### Auth

Classic XState use case — lots of transitions, timeouts, side effects, correctness-critical.

```
unauthenticated → submitting → mfa-challenge → authenticated
                     ↓               ↓
                login-failed     mfa-failed → unauthenticated

authenticated → session-expiring → refreshing → authenticated
                                       ↓
                                  refresh-failed → unauthenticated
```

### Onboarding Wizard

Multi-step flow with branching by role, back navigation, skip logic, resume capability. XState nested states handle branching naturally.

```
welcome → role-select → [coach]  → team-setup → invite-players → complete
                      → [parent] → find-team → complete
                      → [player] → join-team → complete
```

## What Doesn't Need a State Machine

| Concern | Current Tool | Why It's Fine |
|---|---|---|
| Data fetching | React Query | Already handles async states internally |
| Graph mutations / undo | `useState` in `usePracticeEditor` | Pure data operations, no modal transitions |
| UI toggles (sidebar, modals) | Independent `useState` booleans | Simple, non-interacting flags |
| Drill sidebar search/filter | `useState` | Pure data filtering |

## Priority

1. ~~**Canvas interactions**~~ ✅ Done
2. **Autosave** — when error/conflict handling is needed
3. **Auth** — when building auth flow
4. **Onboarding** — when building onboarding
5. **Right panel** — only if more panel modes are added
