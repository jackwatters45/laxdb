# feat: Complete Pipeline MVP - Simplified (8 Items)

> **Status**: Ready for implementation
> **PRD Items**: 8 (simplified from 25 based on reviews)
> **Reviewers**: DHH, Kieran, Simplicity - unanimous recommendation to cut scope

---

## Overview

Ship a public `/stats` page that displays lacrosse stats from all 5 leagues (PLL, NLL, MLL, MSL, WLA) with filtering, pagination, and sorting. Hourly cron refreshes data.

**What we're building:**
1. Stats RPC API (3 endpoints)
2. Players RPC API (2 endpoints)
3. Teams RPC API (2 endpoints)
4. Frontend stats table with URL state
5. Hourly cron with loader integration
6. Alchemy deployment

**What we're NOT building (deferred):**
- Rate limiting middleware (use Cloudflare dashboard)
- Input sanitization middleware (Effect Schema handles this)
- Client SDK (use RPC client directly)
- Circuit breaker (manual monitoring for MVP)
- Virtualization (paginate at 50, native scroll fine)
- TypeScript discriminated unions (stats already uniform)
- Performance benchmarks (measure in prod)
- Search with debounce (use browser Cmd+F)

---

## Technical Approach

### Architecture (Simplified)

```
┌─────────────────────────────────────────────────┐
│               Cloudflare Workers                 │
├───────────────┬───────────────┬─────────────────┤
│     web       │      api      │   api (cron)    │
│  TanStack     │  Effect RPC   │   scheduled()   │
│   Start       │               │                 │
├───────────────┴───────────────┴─────────────────┤
│              KV Namespace (1)                    │
│   cache:player:* │ cache:leaderboard:*          │
├─────────────────────────────────────────────────┤
│            Hyperdrive → PlanetScale             │
└─────────────────────────────────────────────────┘
```

**Key simplifications:**
- Cron runs in api worker, not separate pipeline worker
- One KV namespace with prefixes, not 3
- No middleware abstractions - inline where needed

---

## Implementation Items

### Item 1: Stats RPC Endpoints (api-001)

**Files:**
- `packages/core/src/pipeline/stats.schema.ts` - Input/output schemas
- `packages/core/src/pipeline/stats.contract.ts` - Contract definitions
- `packages/pipeline/src/rpc/stats.rpc.ts` - RPC handlers

**Contract (following Kieran's feedback - use Schema.Class):**
```typescript
// stats.schema.ts
export class GetPlayerStatsInput extends Schema.Class<GetPlayerStatsInput>(
  "GetPlayerStatsInput",
)({
  playerId: Schema.Number,
  seasonId: Schema.optional(Schema.Number),
}) {}

export class GetLeaderboardInput extends Schema.Class<GetLeaderboardInput>(
  "GetLeaderboardInput",
)({
  leagues: Schema.Array(Schema.Literal("PLL", "NLL", "MLL", "MSL", "WLA")),
  sort: Schema.Literal("points", "goals", "assists"),
  cursor: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Number).pipe(Schema.withDefault(() => 50)),
}) {}

// stats.contract.ts
export const StatsContract = {
  getPlayerStats: {
    success: Schema.Array(PlayerStatWithDetails),
    error: StatsErrors,
    payload: GetPlayerStatsInput,
  },
  getLeaderboard: {
    success: Schema.Struct({
      data: Schema.Array(LeaderboardEntry),
      nextCursor: Schema.NullOr(Schema.String),
    }),
    error: StatsErrors,
    payload: GetLeaderboardInput,
  },
  getTeamStats: {
    success: Schema.Array(TeamStatSummary),
    error: StatsErrors,
    payload: GetTeamStatsInput,
  },
} as const;
```

**Endpoints:**
- `GetPlayerStats` - Stats for a single player
- `GetLeaderboard` - Paginated leaderboard with filters
- `GetTeamStats` - Team aggregate stats

---

### Item 2: Players RPC Endpoints (api-002)

**Files:**
- `packages/core/src/pipeline/players.schema.ts`
- `packages/core/src/pipeline/players.contract.ts`
- `packages/pipeline/src/rpc/players.rpc.ts`

**Endpoints:**
- `GetPlayer` - Canonical player with all source records
- `SearchPlayers` - Search by name (uses normalized_name)

---

### Item 3: Teams RPC Endpoints (api-003)

**Files:**
- `packages/core/src/pipeline/teams.schema.ts`
- `packages/core/src/pipeline/teams.contract.ts`
- `packages/pipeline/src/rpc/teams.rpc.ts`

**Endpoints:**
- `GetTeam` - Team details with roster
- `GetTeams` - Teams by league/season

---

### Item 4: /stats Route with URL State (frontend-001)

**Files:**
- `packages/web/src/routes/_public/stats/index.tsx`

**URL State (using literal types per Kieran):**
```typescript
const SortColumn = Schema.Literal("points", "goals", "assists");
const SortOrder = Schema.Literal("asc", "desc");
const LeagueAbbreviation = Schema.Literal("PLL", "NLL", "MLL", "MSL", "WLA");

const statsSearchSchema = Schema.standardSchemaV1(
  Schema.Struct({
    leagues: Schema.optional(Schema.String),  // Comma-separated, parsed to array
    sort: Schema.optional(SortColumn),
    order: Schema.optional(SortOrder),
    after: Schema.optional(Schema.String),    // Simple cursor (stat ID)
  }),
);
```

**Defaults:** leagues=PLL,NLL, sort=points, order=desc

---

### Item 5: StatsTable with Pagination (frontend-002)

**Files:**
- `packages/web/src/routes/_public/stats/-components/stats-table.tsx`
- `packages/web/src/routes/_public/stats/-components/pagination.tsx`

**Features:**
- TanStack Query with 5min staleTime
- Simple cursor pagination (50 per page, no prefetch)
- Sort by clicking column headers
- Data Platform design (dense, monospace numbers)

**No virtualization** - paginate at 50 rows, native scroll handles this fine.

---

### Item 6: League Filter Checkboxes (frontend-003)

**Files:**
- `packages/web/src/routes/_public/stats/-components/league-filter.tsx`

**Features:**
- Checkboxes for PLL, NLL, MLL, MSL, WLA
- Sync with URL state
- At least one league required (disable query otherwise)

---

### Item 7: Unified Cron Worker (cron-unified)

**Files:**
- `packages/api/src/cron/scheduled.ts` - Cron handler in api worker
- `packages/pipeline/src/config/seasons.ts` - Season configuration

**Season Config (type-safe per Kieran):**
```typescript
type LeagueAbbreviation = "PLL" | "NLL" | "MLL" | "MSL" | "WLA";

interface SeasonConfig {
  readonly start: { readonly month: number; readonly day: number };
  readonly end: { readonly month: number; readonly day: number };
  readonly historical?: boolean;
}

export const LEAGUE_SEASONS: Record<LeagueAbbreviation, SeasonConfig> = {
  PLL: { start: { month: 6, day: 1 }, end: { month: 9, day: 15 } },
  NLL: { start: { month: 12, day: 1 }, end: { month: 5, day: 15 } },
  MLL: { start: { month: 5, day: 1 }, end: { month: 8, day: 30 }, historical: true },
  MSL: { start: { month: 5, day: 1 }, end: { month: 9, day: 30 } },
  WLA: { start: { month: 5, day: 1 }, end: { month: 9, day: 30 } },
};
```

**Cron Flow (with error isolation per Kieran):**
```typescript
export async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
  const activeLeagues = getActiveLeagues(new Date());
  if (activeLeagues.length === 0) return;

  // Run all extractions, don't let one failure stop others
  const results = await Promise.allSettled(
    activeLeagues.map(async (league) => {
      await extractLeague(league, env);
      await loadLeague(league, env);
      await invalidateCache(league, env);
    })
  );

  // Log failures
  for (const [i, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(`Failed: ${activeLeagues[i]}`, result.reason);
    }
  }
}
```

**No circuit breaker** - if extraction fails, log it, try again next hour. Add circuit breaker when there's evidence of need.

---

### Item 8: Alchemy Deployment (deploy-001)

**Files:**
- `alchemy.run.ts` - Add cron trigger and KV

**Configuration:**
```typescript
// Single KV namespace with prefixes
export const pipelineKV = await KVNamespace("pipeline", {
  title: `laxdb-pipeline-${stage}`,
});

// Api worker with cron trigger
export const api = await Worker("api", {
  cwd: "./packages/api",
  bindings: {
    DB: db,
    PIPELINE_KV: pipelineKV,
    DATABASE_URL: dbRole.connectionUrl,
    ...secrets,
  },
  scheduled: ["0 * * * *"], // Hourly cron
});
```

---

## Acceptance Criteria

### API
- [ ] `GetLeaderboard` returns paginated stats with cursor
- [ ] `GetPlayerStats` returns stats for a player
- [ ] `SearchPlayers` returns matches for query
- [ ] RPC contracts use `Schema.Class` for payloads

### Frontend
- [ ] `/stats` renders table with default leagues (PLL, NLL)
- [ ] League checkboxes sync with URL
- [ ] Sort by points/goals/assists via column headers
- [ ] Pagination with "Load more" or prev/next
- [ ] Design: dense, monospace numbers, sticky header
- [ ] Verify in browser

### Cron
- [ ] Hourly cron extracts active leagues only
- [ ] Loader runs after extraction
- [ ] Cache invalidated after load
- [ ] Errors isolated per league (one failure doesn't stop others)

### Deploy
- [ ] Api worker has cron trigger
- [ ] Single KV namespace for cache
- [ ] Works in dev environment

---

## Files to Create/Modify

### New Files (10)
```
packages/core/src/pipeline/
├── stats.schema.ts
├── stats.contract.ts
├── players.schema.ts
├── players.contract.ts
├── teams.schema.ts
├── teams.contract.ts

packages/pipeline/src/rpc/
├── stats.rpc.ts
├── players.rpc.ts
├── teams.rpc.ts
├── index.ts

packages/pipeline/src/config/
├── seasons.ts

packages/api/src/cron/
├── scheduled.ts

packages/web/src/routes/_public/stats/
├── index.tsx
└── -components/
    ├── stats-table.tsx
    ├── league-filter.tsx
    └── pagination.tsx
```

### Modified Files (3)
```
alchemy.run.ts                     # Add cron trigger, KV namespace
packages/api/src/index.ts          # Export scheduled handler
packages/api/src/rpc-group.ts      # Register pipeline RPCs
```

---

## Deferred to Phase 2

| Item | Reason | Trigger to Add |
|------|--------|----------------|
| Rate limiting | Cloudflare dashboard sufficient | Traffic abuse |
| Input sanitization | Effect Schema + React handles it | Security audit |
| Virtualization | 50 rows pagination, native scroll fine | Table feels slow |
| Circuit breaker | Manual monitoring for MVP | Frequent failures |
| Search with debounce | Browser Cmd+F works | User feedback |
| Performance benchmarks | Measure in prod | Latency complaints |
| Client SDK | RPC client works directly | Multiple consumers |

---

## References

- `packages/api/src/game/game.rpc.ts` - RPC pattern
- `packages/core/src/game/game.contract.ts` - Contract pattern
- `packages/web/src/routes/(auth)/login.tsx` - URL validation
