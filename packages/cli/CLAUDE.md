# @laxdb/cli - CLI Tools

> **When to read:** Adding CLI commands, testing API endpoints from terminal.

Effect CLI for interacting with the laxdb API via RPC. Each domain has its own entrypoint.

## STRUCTURE

```
src/
├── shared.ts    # Common flags (--pretty, --base-url) and output helpers
├── drill.ts     # Drill CRUD commands
├── player.ts    # Player CRUD commands
└── practice.ts  # Practice CRUD commands
```

## USAGE

```bash
# Drills
bun src/drill.ts list --pretty
bun src/drill.ts get <publicId>
bun src/drill.ts create --name "Box Passing" --category passing
bun src/drill.ts update <publicId> --name "New Name"
bun src/drill.ts delete <publicId>

# Players
bun src/player.ts list --pretty
bun src/player.ts get <publicId>

# Practices
bun src/practice.ts list --pretty
bun src/practice.ts get <publicId>

# Custom API URL
bun src/drill.ts --base-url https://api.laxdb.io list
LAXDB_API_URL=https://api.laxdb.io bun src/drill.ts list
```

## ADDING A COMMAND

1. Create `src/{domain}.ts`
2. Import RPC client from `@laxdb/api-v2/{domain}/{domain}.client`
3. Use `Flag` from `effect/unstable/cli` for args
4. Reuse `prettyFlag`, `baseUrlFlag`, `output` from `shared.ts`

## COMMANDS

```bash
bun run typecheck    # Type check
bun run fix          # Lint + format
```
