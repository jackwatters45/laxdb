# Infrastructure Migration Plan: SST → Alchemy

## Overview

Migration from SST to Alchemy for Cloudflare-native infrastructure. This document tracks what's been done, what's broken, and what needs to be fixed.

## Current State

### Completed

- [x] Created `packages/core/src/config.ts` with AppConfig using Effect Config
- [x] Updated `alchemy.run.ts` with secret bindings (DATABASE_URL, GOOGLE_CLIENT_ID, etc.)
- [x] Migrated `drizzle.service.ts` to use `AppConfig.databaseUrl`
- [x] Migrated `auth.ts` to use `process.env.*` for OAuth secrets
- [x] Migrated `email.service.ts` to use `AppConfig.*`
- [x] Migrated 7 API client files to use `process.env.API_URL`
- [x] Migrated `redis.ts` to use `process.env.REDIS_*`
- [x] Created `packages/core/src/kv.ts` for Cloudflare KV (not yet wired up)
- [x] Removed all SST `Resource.*` usages (except commented code in auth.ts)

### Broken (Blocking Deployment)

#### packages/api TypeScript Errors

| File | Error | Root Cause |
|------|-------|------------|
| `*.client.ts` (7 files) | `'RpcProtocolLive' not exported` | Protocol changed to factory function |
| `client.ts` | `Property 'Default' does not exist on RpcXClient` | Effect service structure broken |
| `index.ts:71` | Layer composition type error | Missing dependencies in layer stack |
| `team.repo.ts:91,103` | Missing `headers` in API calls | better-auth API requires headers |

#### packages/core TypeScript Errors

| File | Error | Root Cause |
|------|-------|------------|
| `auth.ts:222-223` | Unused variables `_`, `_inviteLink` | Pre-existing (not blocking) |

### Not Yet Wired Up

| Component | Status | Notes |
|-----------|--------|-------|
| Cloudflare KV | Created but not used | `kv.ts` ready, auth.ts still uses Redis |
| Hyperdrive | Binding exists | Need to verify it works with @effect/sql-pg |
| Better Auth secrets | env vars set | Need runtime testing |

---

## Phase 1: Fix TypeScript Errors (Blocking)

### 1.1 Fix RPC Protocol Layer

**Problem**: `protocol.ts` exports `makeRpcProtocol(apiUrl)` function, but clients import `RpcProtocolLive` constant.

**Current** (`protocol.ts`):
```typescript
export const makeRpcProtocol = (apiUrl: string) =>
  RpcClient.layerProtocolHttp({ url: `${apiUrl}/rpc` })
    .pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));
```

**Solution Options**:

A. **Export both** (recommended):
```typescript
// For server-side where API_URL is known at load time
export const RpcProtocolLive = makeRpcProtocol(process.env.API_URL!);

// For dynamic/client-side usage
export const makeRpcProtocol = (apiUrl: string) => ...;
```

B. **Lazy initialization**:
```typescript
let _protocol: Layer<...> | null = null;
export const RpcProtocolLive = () => {
  if (!_protocol) _protocol = makeRpcProtocol(process.env.API_URL!);
  return _protocol;
};
```

### 1.2 Fix RPC Client Services

**Problem**: `RpcXClient` classes don't have `.Default` property.

**Root cause**: The `Effect.Service` definition is likely missing dependencies or has incorrect structure.

**Current** (`auth.client.ts`):
```typescript
export class RpcAuthClient extends Effect.Service<RpcAuthClient>()(
  'RpcAuthClient',
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(AuthRpcs),
  }
) {}
```

**Investigation needed**:
- [ ] Check if `RpcProtocolLive` is a valid Layer
- [ ] Verify `RpcClient.make(AuthRpcs)` returns correct type
- [ ] Ensure Effect version compatibility

### 1.3 Fix API Index Layer Composition

**Problem**: `index.ts:71` - Layer types don't match.

**Current**:
```typescript
const { handler } = HttpApiBuilder.toWebHandler(
  HttpApiBuilder.serve(HttpMiddleware.logger).pipe(Layer.provide(ApiLive))
);
```

**Investigation needed**:
- [ ] Check what dependencies `ApiLive` requires
- [ ] Ensure all required services are provided
- [ ] Verify @effect/platform version compatibility

### 1.4 Fix team.repo.ts Headers

**Problem**: better-auth API calls missing required `headers` property.

**Current**:
```typescript
auth.auth.api.createInvitation({ body })
auth.auth.api.removeTeamMember({ body: {...} })
```

**Solution**:
```typescript
auth.auth.api.createInvitation({ body, headers: new Headers() })
// Or pass actual headers from request context
```

---

## Phase 2: Wire Up Cloudflare Services

### 2.1 Decision: Redis vs Cloudflare KV

**Current state**:
- `redis.ts` uses ioredis with `process.env.REDIS_*`
- `kv.ts` created with Cloudflare KV implementation
- `auth.ts` ManagedRuntime uses `RedisService.Default`

**Options**:

A. **Keep Redis** (Upstash or similar):
- Add REDIS_* env vars to alchemy.run.ts bindings
- Simpler migration, Redis protocol works
- Cost: external service dependency

B. **Switch to Cloudflare KV** (recommended for CF-native):
- Wire `KVServiceLive(env.KV)` into auth runtime
- Challenge: runtime created at module load, KV only available at request time
- Solution: Lazy runtime initialization or restructure auth

**Recommended approach**:
```typescript
// In auth.ts - create runtime lazily with KV binding
let _runtime: ManagedRuntime<...> | null = null;
export const getAuthRuntime = (kvBinding: KVNamespace) => {
  if (!_runtime) {
    _runtime = ManagedRuntime.make(
      Layer.mergeAll(KVServiceLive(kvBinding), DatabaseLive)
    );
  }
  return _runtime;
};
```

### 2.2 Verify Hyperdrive Connection

**Test checklist**:
- [ ] Deploy to Cloudflare
- [ ] Verify `env.DB` binding is accessible
- [ ] Test database query via Hyperdrive
- [ ] Check connection pooling works

### 2.3 Environment Variables

**Required env vars** (add to .env and CI secrets):
```bash
# OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Polar
POLAR_WEBHOOK_SECRET=xxx

# Email (optional, has defaults)
AWS_REGION=us-west-2
EMAIL_SENDER=noreply@laxdb.io

# Redis (if keeping Redis)
REDIS_HOST=xxx
REDIS_PORT=6379
REDIS_USERNAME=xxx
REDIS_PASSWORD=xxx
```

---

## Phase 3: Deploy & Test

### 3.1 Local Development

```bash
bun run dev  # Uses alchemy dev mode
```

**Test checklist**:
- [ ] App starts without errors
- [ ] Auth flow works (Google OAuth)
- [ ] Database queries work
- [ ] Rate limiting works (Redis/KV)

### 3.2 Staging Deployment

```bash
bun run deploy  # Deploys to Cloudflare
```

**Test checklist**:
- [ ] Worker deploys successfully
- [ ] Custom domain works
- [ ] Database connection via Hyperdrive works
- [ ] Auth flow works in production
- [ ] KV/Redis caching works

---

## Phase 4: Cleanup & Polish

### 4.1 Remove Dead Code

- [ ] Delete commented SST Resource code in auth.ts (if confirmed unused)
- [ ] Remove `sst` from any package.json if present
- [ ] Clean up unused imports

### 4.2 Documentation

- [ ] Update README with new env var requirements
- [ ] Document Alchemy deployment process
- [ ] Update architecture diagrams

### 4.3 CI/CD

- [ ] Update GitHub Actions with new secrets
- [ ] Verify deploy.yml works with Alchemy
- [ ] Add health check after deployment

---

## Dependencies to Verify

| Package | Current | Used For | Notes |
|---------|---------|----------|-------|
| `@effect/platform` | ? | HTTP server | Check version compat |
| `@effect/rpc` | ? | RPC layer | Check version compat |
| `@effect/sql-pg` | ? | PostgreSQL | Works with Hyperdrive? |
| `better-auth` | ? | Authentication | Check API changes |
| `ioredis` | ? | Redis client | Keep or remove |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hyperdrive doesn't work with @effect/sql-pg | High | Test early, fallback to direct connection |
| KV migration breaks auth rate limiting | Medium | Keep Redis as fallback |
| Layer composition issues in Effect | High | Consult Effect docs, may need version updates |
| Better-auth API changes | Medium | Check breaking changes, update calls |

---

## Success Criteria

1. `bun run typecheck` passes with 0 errors
2. `bun run dev` starts local development successfully
3. `bun run deploy` deploys to Cloudflare
4. Auth flow works end-to-end
5. Database CRUD operations work
6. No SST dependencies remain

---

_Last updated: December 22, 2025_
