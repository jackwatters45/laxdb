# @laxdb/api-v2 - Effect RPC API

> **When to read:** Adding/modifying API endpoints, RPC handlers, HTTP routes.

Effect-based API using `HttpApi` + `RpcGroup` for type-safe client-server communication.

## STRUCTURE

```
src/
├── definition.ts          # LaxdbApiV2 HttpApi (aggregates all groups)
├── protocol.ts            # RPC client protocol (HTTP + NDJSON)
├── rpc-group.ts           # RPC group (aggregates all RPC definitions)
├── rpc-handlers.ts        # RPC handler implementations
├── client.ts              # HTTP API client
├── index.ts               # Public exports
├── drill/                 # Drill domain
│   ├── drill.api.ts         # HttpApi group (REST routes)
│   ├── drill.rpc.ts         # RPC definitions (typed requests)
│   ├── drill.handlers.ts    # RPC handler implementations
│   └── drill.client.ts      # RPC client wrapper
├── player/                # Player domain
│   ├── player.api.ts
│   ├── player.rpc.ts
│   ├── player.handlers.ts
│   └── player.client.ts
├── practice/              # Practice domain
│   ├── practice.api.ts
│   ├── practice.rpc.ts
│   ├── practice.handlers.ts
│   └── practice.client.ts
└── groups/                # Group aggregation
    └── index.ts
```

## ADDING AN ENDPOINT

1. Define RPC request/response in `{domain}.rpc.ts`
2. Implement handler in `{domain}.handlers.ts`
3. Add client method in `{domain}.client.ts`
4. If REST, add route in `{domain}.api.ts` and register in `definition.ts`
5. Register RPC in `rpc-group.ts` and handler in `rpc-handlers.ts`

## COMMANDS

```bash
bun run typecheck    # Type check
bun run fix          # Lint + format
```
