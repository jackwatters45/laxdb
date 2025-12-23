# Effect-Cloudflare Integration Guide

This document explains how to integrate the `effect-cloudflare` package with the `@laxdb/core` package to build type-safe Cloudflare Workers with Effect.

## Overview

The `effect-cloudflare` package provides Effect-based wrappers around Cloudflare Workers bindings:

| Module        | Wraps           | Key Features                                            |
| ------------- | --------------- | ------------------------------------------------------- |
| `Worker`      | Fetch handler   | Entry point creation, automatic binding effectification |
| `KVNamespace` | KV storage      | Type-safe operations, granular error types              |
| `D1Database`  | SQLite database | Prepared statements, batch operations, sessions         |
| `R2Bucket`    | Object storage  | Streaming, multipart uploads, conditional requests      |

## Quick Start

### 1. Basic Worker Setup

```typescript
// src/worker.ts
import * as Worker from "effect-cloudflare/Worker";
import * as Layer from "effect/Layer";
import * as Effect from "effect/Effect";

export default Worker.makeFetchEntryPoint(
  (req, env, ctx) => Effect.gen(function* () {
    // env bindings are automatically "effectified"
    // env.MY_KV is now an Effect-based KVNamespace
    const value = yield* env.MY_KV.get("key");

    return new Response(JSON.stringify({ value }));
  }),
  { layer: Layer.empty }
);
```

### 2. Type Configuration

Create `worker-configuration.d.ts`:

```typescript
interface CloudflareEnv {
  KV: KVNamespace;
  DB: D1Database;
  BUCKET: R2Bucket;
  // ... other bindings
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
```

---

## Integrating with Core Package

### Current Architecture (core/kv.ts)

The core package currently has a basic KV service:

```typescript
// packages/core/src/kv.ts (current)
export class KVService extends Effect.Service<KVService>()('KVService', {
  effect: Effect.gen(function* () {
    const kv = yield* KVNamespaceBinding;
    return {
      get: Effect.fn('KV:get')(function* (key: string) {
        return yield* Effect.tryPromise(() => kv.get(key)).pipe(
          Effect.mapError((cause) => new KVError({ msg: `Failed to get key: ${key}`, cause }))
        );
      }),
      // ... other methods
    };
  }),
}) {}
```

### Enhanced Architecture with effect-cloudflare

Replace with the more comprehensive Effect-based wrapper:

```typescript
// packages/core/src/kv.ts (enhanced)
import * as KV from "effect-cloudflare/KVNamespace";
import { Context, Effect, Layer } from "effect";

// Re-export error types for consumers
export {
  KVNamespaceError,
  KVRateLimitError,
  KVJsonParseError,
  KVInvalidKeyError,
  // ... other error types
} from "effect-cloudflare/KVNamespace";

/**
 * Context tag for the effectified KV namespace.
 * Consumers depend on this rather than the raw binding.
 */
export class EffectKVNamespace extends Context.Tag("EffectKVNamespace")<
  EffectKVNamespace,
  KV.KVNamespace
>() {}

/**
 * Layer that creates the KVNamespace from a raw Cloudflare binding.
 * Used during worker initialization.
 */
export const EffectKVNamespaceLive = (kv: globalThis.KVNamespace) =>
  Layer.succeed(EffectKVNamespace, KV.make(kv));

/**
 * Enhanced KV Service with granular error handling.
 */
export class KVService extends Effect.Service<KVService>()("KVService", {
  effect: Effect.gen(function* () {
    const kv = yield* EffectKVNamespace;

    return {
      /**
       * Get a value with proper null handling via Option.
       */
      get: <T = string>(key: string, type?: "text" | "json") =>
        Effect.gen(function* () {
          if (type === "json") {
            return yield* kv.get<T>(key, "json");
          }
          return yield* kv.get(key);
        }),

      /**
       * Get with metadata for cache status and expiration info.
       */
      getWithMetadata: <T = string, M = unknown>(key: string) =>
        kv.getWithMetadata<M>(key),

      /**
       * Put a value with optional TTL.
       */
      put: (key: string, value: string, options?: { expirationTtl?: number }) =>
        kv.put(key, value, options),

      /**
       * Delete a key.
       */
      delete: (key: string) => kv.delete(key),

      /**
       * List keys with pagination support.
       */
      list: <M = unknown>(options?: KVNamespaceListOptions) =>
        kv.list<M>(options),
    };
  }),
  dependencies: [],
}) {}
```

---

## Error Handling

### Granular Error Types

effect-cloudflare provides specific error types for each failure mode:

```typescript
import * as KV from "effect-cloudflare/KVNamespace";
import { Effect, Match } from "effect";

const program = Effect.gen(function* () {
  const kv = yield* EffectKVNamespace;
  yield* kv.put("key", "value");
}).pipe(
  Effect.catchTags({
    // Rate limit: 1 write per second per key
    KVRateLimitError: (e) =>
      Effect.gen(function* () {
        yield* Effect.sleep(e.retryAfter ?? 1000);
        // Retry logic
      }),

    // Key validation (empty, too long, reserved)
    KVInvalidKeyError: (e) =>
      Effect.fail(new ValidationError({ field: "key", reason: e.reason })),

    // Value too large (>25 MiB)
    KVInvalidValueError: (e) =>
      Effect.logError(`Value too large: ${e.sizeBytes} bytes`),

    // Network/transient errors
    KVNetworkError: (e) =>
      Effect.retry(program, { times: 3, schedule: Schedule.exponential("100ms") }),
  })
);
```

### Error Type Reference

| Error Class           | Trigger                         | Recoverable      |
| --------------------- | ------------------------------- | ---------------- |
| `KVRateLimitError`    | >1 write/sec to same key        | Yes (backoff)    |
| `KVInvalidKeyError`   | Empty, ".", "..", >512 bytes    | No               |
| `KVInvalidValueError` | Value >25 MiB                   | No               |
| `KVMetadataError`     | Metadata >1024 bytes            | No               |
| `KVExpirationError`   | TTL <60 seconds                 | No               |
| `KVJsonParseError`    | Non-JSON value with type "json" | Fallback to text |
| `KVNetworkError`      | Transient failures              | Yes (retry)      |

---

## D1 Database Integration

### With Drizzle ORM

```typescript
// packages/core/src/drizzle/drizzle.service.ts
import * as D1 from "effect-cloudflare/D1Database";
import { drizzle } from "drizzle-orm/d1";
import { Context, Effect, Layer } from "effect";
import * as schema from "../schema";

export class EffectD1Database extends Context.Tag("EffectD1Database")<
  EffectD1Database,
  D1.D1Database
>() {}

export const EffectD1DatabaseLive = (db: globalThis.D1Database) =>
  Layer.succeed(EffectD1Database, D1.make(db));

/**
 * Drizzle instance that uses the Effect-wrapped D1.
 * For direct SQL when ORM isn't sufficient.
 */
export class DrizzleService extends Effect.Service<DrizzleService>()("DrizzleService", {
  effect: Effect.gen(function* () {
    const d1 = yield* EffectD1Database;

    // Access raw D1Database for Drizzle initialization
    // Note: Drizzle handles its own Promise-based API
    const db = drizzle(d1["~raw"], { schema });

    return {
      db,

      /**
       * Run a raw SQL query with Effect error handling.
       */
      rawQuery: <T>(sql: string) =>
        Effect.gen(function* () {
          const stmt = d1.prepare(sql);
          return yield* stmt.all<T>();
        }),

      /**
       * Batch multiple statements atomically.
       * All succeed or all fail.
       */
      batch: <T>(statements: D1.D1PreparedStatement[]) =>
        d1.batch<T>(statements),

      /**
       * Create a session for read replica consistency.
       */
      withSession: (bookmarkOrConstraint: D1.D1SessionConstraintOrBookmark) =>
        d1.withSession(bookmarkOrConstraint),
    };
  }),
  dependencies: [],
}) {}
```

### D1 Error Handling

```typescript
import * as D1 from "effect-cloudflare/D1Database";

const insertUser = Effect.gen(function* () {
  const { db } = yield* DrizzleService;

  yield* Effect.tryPromise(() =>
    db.insert(users).values({ email: "user@example.com" })
  );
}).pipe(
  Effect.catchTags({
    // Unique constraint violation
    D1ConstraintError: (e) =>
      e.constraintType === "UNIQUE"
        ? Effect.fail(new DuplicateEmailError())
        : Effect.fail(e),

    // SQL syntax error (development bug)
    D1SQLSyntaxError: (e) =>
      Effect.die(new Error(`SQL Syntax Error: ${e.reason}`)),

    // Query limits (50 queries/invocation on free tier)
    D1QueryLimitError: (e) =>
      Effect.logWarning(`Query limit: ${e.limitType}`),

    // Transient network issues
    D1NetworkError: (e) =>
      e.isTransient
        ? Effect.retry(insertUser, { times: 2 })
        : Effect.fail(e),
  })
);
```

---

## R2 Bucket Integration

### Basic Usage

```typescript
// packages/core/src/storage/storage.service.ts
import * as R2 from "effect-cloudflare/R2Bucket";
import { Context, Effect, Layer, Option } from "effect";

export class EffectR2Bucket extends Context.Tag("EffectR2Bucket")<
  EffectR2Bucket,
  R2.R2Bucket
>() {}

export const EffectR2BucketLive = (bucket: globalThis.R2Bucket) =>
  Layer.succeed(EffectR2Bucket, R2.make(bucket));

export class StorageService extends Effect.Service<StorageService>()("StorageService", {
  effect: Effect.gen(function* () {
    const bucket = yield* EffectR2Bucket;

    return {
      /**
       * Upload a file with optional metadata.
       */
      upload: (key: string, data: ReadableStream | ArrayBuffer | string, options?: R2PutOptions) =>
        bucket.put(key, data, options),

      /**
       * Download a file. Returns Option.none() if not found.
       */
      download: (key: string) =>
        Effect.gen(function* () {
          const obj = yield* bucket.get(key);
          if (Option.isNone(obj)) {
            return Option.none();
          }
          // obj.value is R2ObjectBody with Effect-based methods
          const content = yield* obj.value.text;
          return Option.some(content);
        }),

      /**
       * Download as JSON with type safety.
       */
      downloadJson: <T>(key: string) =>
        Effect.gen(function* () {
          const obj = yield* bucket.get(key);
          if (Option.isNone(obj)) {
            return Option.none();
          }
          const data = yield* obj.value.json<T>();
          return Option.some(data);
        }),

      /**
       * Check if object exists without downloading.
       */
      exists: (key: string) =>
        Effect.map(bucket.head(key), Option.isSome),

      /**
       * Delete object(s).
       */
      delete: (keys: string | string[]) =>
        bucket.delete(keys),

      /**
       * List objects with pagination.
       */
      list: (options?: R2ListOptions) =>
        bucket.list(options),
    };
  }),
  dependencies: [],
}) {}
```

### Multipart Uploads

```typescript
const uploadLargeFile = Effect.gen(function* () {
  const bucket = yield* EffectR2Bucket;

  // Create multipart upload
  const upload = yield* bucket.createMultipartUpload("large-file.zip");

  const parts: R2UploadedPart[] = [];
  let partNumber = 1;

  // Upload parts (each part must be >= 5 MiB except the last)
  for (const chunk of chunks) {
    const part = yield* upload.uploadPart(partNumber, chunk);
    parts.push(part);
    partNumber++;
  }

  // Complete the upload
  const result = yield* upload.complete(parts);

  return result;
}).pipe(
  Effect.catchTag("R2MultipartError", (e) =>
    Effect.gen(function* () {
      yield* Effect.logError(`Multipart failed: ${e.reason}`);
      // Abort to clean up partial upload
      yield* upload.abort();
    })
  )
);
```

---

## Worker Entry Point with Services

### Full Integration Example

```typescript
// src/worker.ts
import * as Worker from "effect-cloudflare/Worker";
import * as Layer from "effect/Layer";
import * as Effect from "effect/Effect";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { EffectKVNamespaceLive } from "@laxdb/core/kv";
import { EffectD1DatabaseLive } from "@laxdb/core/drizzle";
import { EffectR2BucketLive } from "@laxdb/core/storage";

export default Worker.makeFetchEntryPoint(
  (req, env, ctx) => Effect.gen(function* () {
    // Your request handling logic
    const url = new URL(req.url);

    if (url.pathname === "/api/health") {
      return new Response("OK");
    }

    // Use services from the layer
    const result = yield* myBusinessLogic(req);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }).pipe(
    Effect.catchAll((error) =>
      Effect.succeed(new Response(JSON.stringify({ error: String(error) }), { status: 500 }))
    )
  ),
  {
    layer: Layer.mergeAll(
      // Core services from RuntimeServer
      RuntimeServer,
      // Cloudflare bindings (provided at runtime from env)
      // These are added dynamically - see makeFetchEntryPoint implementation
    ),
  }
);
```

### Creating a Custom Entry Point with Bindings

For more control over layer composition:

```typescript
// src/worker.ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { makeEnv } from "effect-cloudflare/internal/env";
import { makeExecutionContext } from "effect-cloudflare/internal/context";

// Define your application layer
const makeAppLayer = (env: Cloudflare.Env) =>
  Layer.mergeAll(
    // Cloudflare bindings
    EffectKVNamespaceLive(env.KV),
    EffectD1DatabaseLive(env.DB),
    EffectR2BucketLive(env.BUCKET),
    // Core services that depend on bindings
    KVService.Default,
    DrizzleService.Default,
    StorageService.Default,
    // Application services
    AuthService.Default,
    OrganizationService.Default,
    // ... etc
  );

export default {
  async fetch(req: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    // Create runtime with environment-specific bindings
    const runtime = ManagedRuntime.make(makeAppLayer(env));

    try {
      const response = await runtime.runPromise(
        handleRequest(req)
      );
      return response;
    } finally {
      // Cleanup (optional, workers are short-lived)
      await runtime.dispose();
    }
  }
};
```

---

## Background Tasks with waitUntil

Use the effectified `ExecutionContext.waitUntil` for background work:

```typescript
import * as Worker from "effect-cloudflare/Worker";

export default Worker.makeFetchEntryPoint(
  (req, env, ctx) => Effect.gen(function* () {
    // Send response immediately
    const response = new Response("Accepted", { status: 202 });

    // Schedule background work
    ctx.waitUntil(
      Effect.gen(function* () {
        yield* Effect.log("Processing in background...");
        yield* env.KV.put("last_processed", new Date().toISOString());
        yield* Effect.sleep("5 seconds");
        yield* Effect.log("Background work complete");
      })
    );

    return response;
  }),
  { layer: Layer.empty }
);
```

---

## Testing

### Unit Testing Services

```typescript
import { Effect, Layer, Option } from "effect";
import { describe, test, expect } from "vitest";
import * as KV from "effect-cloudflare/KVNamespace";
import { KVService, EffectKVNamespace } from "@laxdb/core/kv";

// Create a mock KVNamespace
const createMockKV = (store: Map<string, string> = new Map()): KV.KVNamespace => ({
  get: (key) =>
    Effect.succeed(store.has(key) ? Option.some(store.get(key)!) : Option.none()),
  put: (key, value) =>
    Effect.sync(() => { store.set(key, value as string); }),
  delete: (key) =>
    Effect.sync(() => { store.delete(key); }),
  list: () =>
    Effect.succeed({
      listComplete: true,
      keys: Array.from(store.keys()).map(name => ({
        name,
        expiration: Option.none(),
        metadata: Option.none(),
      })),
      cacheStatus: Option.none(),
    }),
  getWithMetadata: (key) =>
    Effect.succeed({
      value: store.has(key) ? Option.some(store.get(key)!) : Option.none(),
      metadata: Option.none(),
      cacheStatus: Option.none(),
    }),
});

describe("KVService", () => {
  test("should get and set values", async () => {
    const store = new Map<string, string>();
    const mockKV = createMockKV(store);

    const TestLayer = Layer.succeed(EffectKVNamespace, mockKV).pipe(
      Layer.provideMerge(KVService.Default)
    );

    const program = Effect.gen(function* () {
      const kv = yield* KVService;

      // Set a value
      yield* kv.put("testKey", "testValue");

      // Get the value
      const result = yield* kv.get("testKey");

      return result;
    }).pipe(Effect.provide(TestLayer));

    const result = await Effect.runPromise(program);
    expect(Option.isSome(result)).toBe(true);
    expect(Option.getOrNull(result)).toBe("testValue");
  });
});
```

### Integration Testing with Wrangler

```typescript
import { Effect } from "effect";
import { describe, test, beforeAll, afterAll } from "vitest";
import { makePlatformProxy } from "effect-cloudflare/internal/wrangler";

describe("Integration Tests", () => {
  let proxy: Awaited<ReturnType<typeof getPlatformProxy>>;

  beforeAll(async () => {
    // Start local Cloudflare environment
    proxy = await Effect.runPromise(
      Effect.scoped(makePlatformProxy())
    );
  });

  afterAll(async () => {
    await proxy.dispose();
  });

  test("should interact with real KV", async () => {
    const kv = proxy.env.KV;
    await kv.put("test", "value");
    const result = await kv.get("test");
    expect(result).toBe("value");
  });
});
```

---

## Migration Checklist

When migrating existing code to use effect-cloudflare:

- [ ] Add `effect-cloudflare` to package dependencies
- [ ] Create `worker-configuration.d.ts` with binding types
- [ ] Replace manual `Effect.tryPromise` wrappers with effect-cloudflare modules
- [ ] Update error handling to use granular error types
- [ ] Create Layer providers for each binding type
- [ ] Update worker entry point to use `Worker.makeFetchEntryPoint`
- [ ] Add unit tests with mock bindings
- [ ] Test with `wrangler dev` locally

---

## API Reference

### Worker Module

```typescript
makeFetchEntryPoint<R, E>(
  handler: (req: Request, env: CloudflareEnv, ctx: CloudflareExecutionContext) => Effect<Response, E, R>,
  options: { layer: Layer<R, E>; memoMap?: MemoMap }
): ExportedHandler<Cloudflare.Env>
```

### KVNamespace Module

```typescript
make<Key extends string>(kv: globalThis.KVNamespace<Key>): KVNamespace<Key>
layer(kv: globalThis.KVNamespace): Layer<KVNamespace>
withKVNamespace(kv: globalThis.KVNamespace): <A, E, R>(effect: Effect<A, E, R>) => Effect<A, E, R>
```

### D1Database Module

```typescript
make(db: globalThis.D1Database): D1Database
layer(db: globalThis.D1Database): Layer<D1Database>
withD1Database(db: globalThis.D1Database): <A, E, R>(effect: Effect<A, E, R>) => Effect<A, E, R>
```

### R2Bucket Module

```typescript
make(bucket: globalThis.R2Bucket): R2Bucket
layer(bucket: globalThis.R2Bucket): Layer<R2Bucket>
withR2Bucket(bucket: globalThis.R2Bucket): <A, E, R>(effect: Effect<A, E, R>) => Effect<A, E, R>
```
