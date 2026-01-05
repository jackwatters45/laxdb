# @laxdb/scripts - Internal Utility Scripts

Placeholder package for internal utility and maintenance scripts.

## STATUS

Currently minimal - contains only a placeholder Effect program.

## INTENDED USE

This package will house:
- Database maintenance scripts
- Data migration utilities
- One-off cleanup tasks
- Development helper scripts

## RUNNING SCRIPTS

```bash
cd packages/scripts
infisical run --env=dev -- bun src/{script-name}.ts
```

## NOTES

- Scripts should use Effect for error handling
- Use `@laxdb/core` services for DB operations
- Don't duplicate business logic - call existing services
