# @laxdb/cli - CLI Tools

> **When to read:** Adding CLI commands, testing API endpoints from terminal.

Effect CLI for interacting with the laxdb HTTP API via the generated `ApiClient`. Each domain has its own entrypoint.

## ADDING A COMMAND

1. Create/update `src/{domain}.ts`
2. Import `ApiClient` from `@laxdb/api/client`
3. Use generated group calls, e.g. `client.Drills.createDrill({ payload })`
4. Use `Flag` from `effect/unstable/cli` for args
5. Reuse `prettyFlag`, `baseUrlFlag`, `output` from `shared.ts`
