# @laxdb/cli - CLI Tools

> **When to read:** Adding CLI commands, testing API endpoints from terminal.

Effect CLI for interacting with the laxdb API via RPC. Each domain has its own entrypoint.

## ADDING A COMMAND

1. Create `src/{domain}.ts`
2. Import RPC client from `@laxdb/api/{domain}/{domain}.client`
3. Use `Flag` from `effect/unstable/cli` for args
4. Reuse `prettyFlag`, `baseUrlFlag`, `output` from `shared.ts`
