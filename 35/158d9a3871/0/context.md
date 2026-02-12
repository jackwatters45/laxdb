# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Cleanup: unused marketing components + web feedback type error

## Context
The design system consolidation moved components from `components/ui/` to `components/`, creating duplicates. Many components (Solar template leftovers) are commented out in routes. Three have broken imports causing typecheck failures. One web feedback form is missing a required field.

## Dependency trace from routes

**Used (keep):**
- `components/footer.tsx` ← __root.tsx
- `components...

