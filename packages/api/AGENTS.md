# @laxdb/api - Effect RPC + HTTP API

Cloudflare Worker exposing Effect RPC and REST endpoints. Consumes @laxdb/core services.

## STRUCTURE

```
src/
├── {domain}/
│   ├── {domain}.rpc.ts      # RpcGroup + handlers
│   ├── {domain}.api.ts      # HttpApi routes (OpenAPI)
│   └── {domain}.client.ts   # Client exports
├── index.ts                 # Worker entry, composes all layers
├── client.ts                # RPC client factory
├── protocol.ts              # RPC protocol definition
└── middleware.ts            # Shared middleware
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add RPC endpoint | `src/{domain}/{domain}.rpc.ts` |
| Add REST endpoint | `src/{domain}/{domain}.api.ts` |
| Export client | `src/{domain}/{domain}.client.ts` |
| Modify CORS/middleware | `src/index.ts` |
| Register new domain | Add to `AllRpcs` and `AllApis` in `src/index.ts` |

## ADDING NEW DOMAIN (Checklist)

1. Create contract in `@laxdb/core` first (`{domain}.contract.ts`)
2. Create `{domain}.rpc.ts` with RpcGroup + handlers
3. Create `{domain}.api.ts` with HttpApi group
4. Create `{domain}.client.ts` for exports
5. **Register in `src/index.ts`**:
   - Add to `AllRpcs`: `RpcServer.layer(MyRpcs).pipe(Layer.provide(MyHandlers))`
   - Add to `AllApis`: `MyApiLive`

## RPC HANDLER PATTERN

```typescript
export class MyRpcs extends RpcGroup.make(
  Rpc.make("MyAction", {
    success: MyContract.action.success,
    error: MyContract.action.error,
    payload: MyContract.action.payload,
  }),
) {}

export const MyHandlers = MyRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* MyService;
    return {
      MyAction: (payload) => service.method(payload),
    };
  }),
).pipe(Layer.provide(MyService.Default));
```

## HTTP API PATTERN

```typescript
export const MyApiLive = HttpApiBuilder.group(MyApi, "my", (handlers) =>
  handlers
    .handle("list", ({ urlParams }) => service.list(urlParams))
    .handle("create", ({ payload }) => service.create(payload))
);
```

## ANTI-PATTERNS

| Pattern | Why Bad | Do Instead |
|---------|---------|------------|
| Business logic in handlers | Duplicates/diverges from core | Keep in @laxdb/core services |
| Skip `Layer.provide` | Handlers won't get dependencies | Always provide service deps |
| Direct DB access | Bypasses service layer | Go through @laxdb/core repos |
| Forget to register | Endpoint won't work | Add to AllRpcs/AllApis |

## ENDPOINTS

| Path | Method | Description |
|------|--------|-------------|
| `/rpc` | POST | Effect RPC (NDJSON serialization) |
| `/docs` | GET | Scalar OpenAPI UI |
| `/health` | GET | Health check |

## NOTES

- **Entry point**: `src/index.ts` exports `{ fetch: handler }`
- **CORS**: Currently `allowedOrigins: ["*"]` (open)
- **All domain handlers follow same pattern** - consistency is key
