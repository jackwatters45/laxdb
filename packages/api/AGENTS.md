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

## CONVENTIONS

### RPC Handler Pattern

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

### HTTP API Pattern

```typescript
export const MyApiLive = HttpApiBuilder.group(MyApi, "my", (handlers) =>
  handlers
    .handle("list", ({ urlParams }) => service.list(urlParams))
    .handle("create", ({ payload }) => service.create(payload))
);
```

### Adding New Domain

1. Create contract in `@laxdb/core` first
2. Create `{domain}.rpc.ts` with RpcGroup
3. Create `{domain}.api.ts` with HttpApi handlers
4. Create `{domain}.client.ts` for exports
5. Add to `AllRpcs` and `AllApis` in `index.ts`

## ANTI-PATTERNS

- **Business logic in handlers**: Keep in @laxdb/core services
- **Skip Layer.provide**: Handlers must provide service dependencies
- **Direct DB access**: Always go through @laxdb/core repos

## NOTES

- **Entry point**: `src/index.ts` exports `{ fetch: handler }`
- **RPC endpoint**: `/rpc` (NDJSON serialization)
- **OpenAPI docs**: `/docs` (Scalar UI)
- **Health check**: `/health`
- **CORS**: Currently `allowedOrigins: ["*"]`
