# @laxdb/effect-cloudflare - Effect Bindings for Cloudflare (EXPERIMENTAL)

> **When to read:** Experimental, not production-ready. Only for extending CF binding wrappers.

Type-safe Effect wrappers for Cloudflare Workers primitives.

## STATUS

**Experimental** - Not production-ready. API may change.

## AVAILABLE BINDINGS

| Module | Cloudflare Primitive | Status |
|--------|---------------------|--------|
| `KVNamespace` | KV store | Basic operations |
| `R2Bucket` | Object storage | Scaffolded |
| `D1Database` | SQLite database | Scaffolded |
| `Worker` | Worker utilities | Scaffolded |

## USAGE PATTERN

```typescript
import { KVNamespace } from "@laxdb/effect-cloudflare/KVNamespace";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const kv = yield* KVNamespace;
  const value = yield* kv.get("key");
  return value;
}).pipe(Effect.provide(KVNamespace.layer(env.MY_KV)));
```

## STRUCTURE

```
src/
├── KVNamespace.ts      # Public KV API
├── R2Bucket.ts         # Public R2 API
├── D1Database.ts       # Public D1 API
├── Worker.ts           # Worker utilities
└── internal/           # Implementation details
    ├── kv-namespace.ts # KV implementation
    ├── r2-bucket.ts    # R2 implementation
    └── ...
```

## NOTES

- Wraps raw Cloudflare bindings with Effect error handling
- Tagged errors for each operation type
- Not currently used in production (using raw bindings instead)
