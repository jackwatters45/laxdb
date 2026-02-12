# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Changelog Page — Content Collections Data Source

## Context

Changelog page UI is mostly built (timeline, entry component, route, footer link). Currently uses a hardcoded array in `lib/changelog.ts`. Need to swap to Content Collections so entries are authored as MDX files — same pattern as the blog. This decouples changelog from GitHub releases (which are auto-tagged per PR, too granular).

## Files

### Create

| File | Purpose |
|------|---------|
| `src/c...

