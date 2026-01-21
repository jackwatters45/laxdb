# LaxDB Pipeline Specification (Enhanced)

> **Enhancement Summary**: Plan deepened with 16 parallel research/review agents covering architecture, performance, security, frontend patterns, cron scheduling, player identity resolution, and agent-native AI design. Key themes: aggressive MVP scoping (defer 67% of features), KV caching with smart TTLs, Effect-TS service patterns, TanStack Query for data tables, and atomic tool primitives for AI interface.

---

## DB + Backend

- [ ] Store stats on a per game basis where possible and then use a materialized view for totals? may be more reliable to just use the source for totals in case per-game data is missing
- [ ] Should the schemas be the same as they will be in the team management app? or should these be separate since different function?
- [ ] Take care in how we name these - depending on how we determine difference(s) if any between player management operations
- [ ] Should be pretty simple CRUD but we want it performance optomized - use KV for caching. We want this fast AF since it should do its job better than the sources
- [ ] No auth needed - public and not behind a paywall
- [ ] It is crucial we are able to reliably link a players different data to them. Many players play in multiple leagues. We want to use biographical data to connect this so we can view a player and see all their experience/stats.

### Research Insights: DB + Backend

**Architecture (architecture-strategist)**
- Separate stats DB schemas from team management - different access patterns and lifecycles
- Use repository pattern: `StatsRepo` → `StatsService` → `StatsRpc` (follows existing codebase patterns)
- PlanetScale lacks native materialized views - use `stats_totals` table with trigger-based updates or cron refresh
- Index strategy: composite indexes on `(player_id, season_id)`, `(team_id, game_date)`

**KV Caching Strategy (cloudflare-research)**
```
Key Structure:
- stats:player:{id}:season:{seasonId} → TTL: 1 hour (during season), 24h (off-season)
- stats:team:{id}:totals → TTL: 5 minutes (leaderboards)
- stats:game:{id} → TTL: 24 hours (immutable after final)
- player:identity:{canonicalId} → TTL: 7 days (identity mappings)

Pattern: Read-through cache with stale-while-revalidate
```

**Player Identity Resolution (identity-research)** ✅ RESOLVED
- Use Jaro-Winkler similarity on normalized names
- Schema: `player_identities` table with `canonical_id`, `source_id`, `source_league`, `confidence_score`
- Manual override table for edge cases (common names, name changes)

**Confidence Thresholds**:
| Threshold | Action | Criteria |
|-----------|--------|----------|
| ≥0.90 | Auto-merge | Exact name + DOB, or exact name + same team + same season |
| 0.70-0.89 | Review queue | Fuzzy name match + DOB, or exact name + position match |
| <0.70 | Reject | Keep as separate records |

**Scoring Weights**:
- Name similarity (Jaro-Winkler): 40%
- DOB match: 30% (only PLL/NLL have DOB data)
- Position match: 15%
- Same team-season: 15%

**MVP approach**: Start with exact-match only (confidence = 1.0), add fuzzy matching later

**Data Integrity (data-integrity-guardian)**
- Use transactions for multi-table stat inserts
- Add `source_hash` column to detect upstream changes
- Idempotent upserts: `ON CONFLICT (source_id, source_league) DO UPDATE`
- Soft deletes with `deleted_at` for audit trail

**Source Priority & Conflict Resolution** ✅ RESOLVED
| Source | Reliability | Notes |
|--------|-------------|-------|
| PLL API | 1 (highest) | Official API, richest biographical data |
| NLL API | 2 | Official API, good coverage |
| Gamesheet | 3 | MSL 2023+, structured API |
| StatsCrew | 4 | MLL stats, historical |
| Pointstreak/DigitalShift | 5 | MSL/WLA historical, requires browser automation |
| Wayback Machine | 6 (lowest) | MLL schedules only, known gaps 2007-2019 |

| Conflict Type | Resolution Strategy |
|---------------|---------------------|
| Player biographical | PLL > NLL > MLL (higher source wins) |
| Stats (same league) | Latest scrape wins (via `source_hash` tracking) |
| Stats (cross-league) | Never merge - leagues have different scoring rules |
| Team identity | ID mapping table, no auto-merge |
| Player names | Normalize to canonical form, keep originals in source table |

**Performance Targets (performance-oracle)**
- P95 latency: <50ms for single player stats, <200ms for leaderboards
- Cache hit rate target: >90% for repeated queries
- Use cursor pagination (not offset) for large result sets

**Security (security-sentinel)**
- No PII concerns if data is already public from source leagues
- Rate limit API: 100 req/min anonymous, consider higher for identified users later
- Sanitize all external data inputs (XSS in player names, injection in search)

**YAGNI Recommendations (code-simplicity-reviewer)**
- MVP: Skip materialized views - compute totals on read, cache aggressively
- MVP: Skip schema sharing with team management - premature abstraction
- MVP: Identity linking can start with exact match only, add fuzzy later
- DEFER: Complex analytics, historical comparisons

---

## Frontend

- [ ] Use url to preserve state
- [ ] Use our existing data table ui
  - [ ] Just table view to begin
- [ ] allow user to config which leagues they want enabled
- [ ] Graph to see who was teamates would literally be the coolest thing ever
- [ ] Single player page
  - [ ] Stats
  - [ ] Bio, qualitative stats if any
  - [ ] Web search tool?
  - [ ] Connect socials?
  - [ ] By team (for and against) filters
- [ ] Actual analytics
  - [ ] Stats throughout the season ie graph chart for scoring leaders
  - [ ] Single game highs

### Research Insights: Frontend

**URL State (tanstack-research)**
```typescript
// TanStack Router search params pattern
const statsRoute = createFileRoute('/stats')({
  validateSearch: (search) => ({
    leagues: search.leagues?.split(',') ?? ['PLL', 'NLL'],
    sort: search.sort ?? 'points',
    page: Number(search.page) ?? 1,
  }),
})

// Sync with TanStack Query
const { data } = useQuery({
  queryKey: ['stats', leagues, sort, page],
  queryFn: () => fetchStats({ leagues, sort, page }),
  staleTime: 5 * 60 * 1000, // 5 min
})
```

**Data Table Performance (vercel-react-best-practices)**
- Use `@tanstack/react-table` with virtualization for >100 rows
- Prefetch next page on hover: `queryClient.prefetchQuery`
- Suspense boundaries around table, skeleton loaders
- Avoid re-renders: memoize columns, stable row keys

**Teammate Graph (graph-research)**
- **Recommended**: `react-force-graph-2d` (WebGL, handles 1000+ nodes)
- Alternative: `reagraph` (React 18 native, better DX)
- Data structure: nodes = players, edges = shared team-seasons with weight = games together
- Interaction: click node → highlight connections, double-click → navigate to player page
- Performance: lazy load graph data, don't include in initial bundle

**Design Direction (frontend-design)**
Three options presented:
1. **Sports Broadcast**: Dark theme, stat cards with gradient accents, bold typography
2. **Data Platform**: Light/minimal, dense tables, monospace numbers, Bloomberg-terminal aesthetic
3. **Modern Sports App**: Card-based, team colors as accents, mobile-first

Recommendation: Option 2 (Data Platform) aligns with "better than sources" goal - prioritize data density and scannability over flashy visuals.

**Race Conditions (julik-frontend-races-reviewer)**
- Debounce search/filter inputs (300ms)
- Cancel in-flight requests on new query (AbortController)
- Optimistic UI for league toggles with rollback on error
- Guard against stale closures in graph interactions

**TypeScript Patterns (kieran-typescript-reviewer)**
```typescript
// Discriminated unions for player data across leagues
type PlayerStats =
  | { league: 'PLL'; stats: PLLStats }
  | { league: 'NLL'; stats: NLLStats }
  | { league: 'MLL'; stats: MLLStats }

// Branded types for IDs
type PlayerId = string & { readonly brand: unique symbol }
type CanonicalPlayerId = string & { readonly brand: unique symbol }
```

**YAGNI Recommendations (code-simplicity-reviewer)**
- MVP: Table view only, defer graph visualization
- MVP: League filter as simple checkboxes, not complex config UI
- MVP: Single player page with stats table only
- DEFER: Web search, social connections, by-team filters, analytics charts
- DEFER: "Single game highs" - requires additional data modeling

---

## Cron Job Scraping

- [ ] Different field frequencies
  - [ ] Stats - hourly?
  - [ ] Scores - every minute?
  - [ ] Schedule - no idea maybe hourly but then a longer period once initially scraped? since could change but unlikely? hourly might be fine.
- [ ] How to manage when seasons will be
- [ ] Account for when seasons are active
  - [ ] no need to scrape a league when no active season

### Research Insights: Cron Job Scraping

**Cloudflare Cron Triggers (cron-research)**
```typescript
// wrangler.toml - static cron definitions
[triggers]
crons = [
  "*/5 * * * *",  // Every 5 min - live scores during games
  "0 * * * *",    // Hourly - stats refresh
  "0 6 * * *",    // Daily 6am - schedule sync
]

// Limitation: 1-minute minimum, can't do "every 30 seconds"
// For sub-minute: use Durable Objects Alarms
```

**Frequency Strategy (best-practices-research)**
| Data Type | Active Season | Off Season |
|-----------|--------------|------------|
| Live Scores | 1 min (DO Alarms) | Disabled |
| Stats | 15 min | Daily |
| Schedule | 6 hours | Daily |
| Rosters | Daily | Weekly |

**Season Management (pattern-recognition-specialist)**
```typescript
// Existing pattern from pipeline: use config-driven season detection
const LEAGUE_SEASONS = {
  PLL: { start: 'June 1', end: 'September 15' },
  NLL: { start: 'December 1', end: 'May 15' },
} as const

// Cron handler checks before scraping
export default {
  async scheduled(event, env) {
    const activeLeagues = getActiveLeagues(new Date())
    if (activeLeagues.length === 0) return

    await Promise.all(activeLeagues.map(league =>
      scrapeLeague(league, env)
    ))
  }
}
```

**Rate Limiting & Resilience (performance-oracle)**
- Respect source rate limits (check robots.txt, API docs)
- Exponential backoff on failures: 1s, 2s, 4s, 8s, max 5 retries
- Circuit breaker: disable scraping for league after 10 consecutive failures
- Store last successful scrape timestamp per source

**Existing Patterns (from packages/pipeline/AGENTS.md)**
- Use manifest-based incremental extraction (already implemented)
- `safeString` utils for unknown-to-string conversions
- SPA sites need browser automation (Pointstreak/DigitalShift)
- Always verify Wayback Machine coverage before relying on it

**YAGNI Recommendations (code-simplicity-reviewer)**
- MVP: Hourly stats only, no live scores (complex, low value for historical data)
- MVP: Manual season config, not auto-detection
- MVP: Single cron frequency, not differentiated by data type
- DEFER: Sub-minute polling, Durable Objects Alarms
- DEFER: Automatic season detection

---

## AI Interface

- [ ] Allow user to query the data using an agent. eg what team did player x have the most goals against in his nll career.
- [ ] Run using a harness ie opencode
- [ ] this may be behind a paywall - or at the very least free version should be highly rate limited

### Research Insights: AI Interface

**Agent-Native Architecture (agent-native-architecture)**
Core principle: **Parity** - anything a user can do, an agent can do; anything a user can see, an agent can see.

Tool Design (atomic primitives):
```typescript
// Good: Atomic, composable tools
const tools = {
  searchPlayers: { params: { query: string, league?: string } },
  getPlayerStats: { params: { playerId: string, seasonId?: string } },
  getTeamRoster: { params: { teamId: string, seasonId: string } },
  compareStats: { params: { playerIds: string[], stat: string } },
}

// Bad: Monolithic "answer question" tool
```

**MCP Server Pattern (agent-native-architecture)**
```typescript
// Expose as MCP server for any agent harness
import { McpServer } from '@anthropic-ai/mcp'

const server = new McpServer({
  tools: {
    'laxdb.search_players': searchPlayersHandler,
    'laxdb.get_player_stats': getPlayerStatsHandler,
    'laxdb.get_team_roster': getTeamRosterHandler,
    'laxdb.compare_stats': compareStatsHandler,
  },
  resources: {
    'laxdb://leagues': listLeaguesResource,
    'laxdb://seasons/{league}': listSeasonsResource,
  },
})
```

**Rate Limiting (security-sentinel)**
- Token-based rate limiting (not just request count)
- Free tier: 10 queries/day, 1000 tokens/query
- Paid tier: 100 queries/day, 10000 tokens/query
- Use KV for rate limit counters: `ratelimit:ai:{ip}:{date}`

**Query Examples & Grounding (best-practices-research)**
- Provide example queries in system prompt
- Ground responses with source data (include player IDs, game dates)
- Return structured data, let harness format for user
- Include confidence indicators for fuzzy matches

**Effect-TS Integration (tanstack-research)**
```typescript
// Tool handlers as Effect services
const SearchPlayersHandler = Effect.gen(function* () {
  const statsService = yield* StatsService
  return (params: SearchParams) =>
    statsService.searchPlayers(params).pipe(
      Effect.map(formatToolResponse),
      Effect.catchTag('NotFound', () => Effect.succeed({ results: [] }))
    )
})
```

**YAGNI Recommendations (code-simplicity-reviewer)**
- MVP: 3-4 read-only tools (search, get player, get team, compare)
- MVP: Simple IP-based rate limiting
- MVP: Run in existing harness (opencode), not custom UI
- DEFER: Paywall, complex tiering, custom agent UI
- DEFER: Write operations, data export tools

---

## Implementation Priority (MVP Scope)

Based on YAGNI analysis, recommended phase 1:

### Phase 1 (MVP)
1. **Backend**: Stats CRUD with KV caching, exact-match player identity
2. **Frontend**: Data table with URL state, league filter checkboxes
3. **Cron**: Single hourly cron for all data types, manual season config
4. **AI**: Skip for MVP - add after core features stable

### Phase 2 (Post-MVP)
- Fuzzy player identity matching
- Single player page with full details
- Differentiated cron frequencies
- AI interface with MCP server

### Phase 3 (Future)
- Teammate graph visualization
- Analytics charts
- Live scores
- Social connections, web search
- Paid AI tier

---

## Resolved Decisions

### Q1: Schema Sharing ✅
**Decision**: Keep schemas completely separate in `packages/pipeline` for now.
- Rationale: Better dev focus, avoid premature abstraction
- Future: Move to `core` when team management needs overlap

### Q2: Identity Confidence Thresholds ✅
See **Player Identity Resolution** section in DB + Backend for full details.
- Auto-merge ≥0.90, Review queue 0.70-0.89, Reject <0.70
- MVP: Exact-match only (confidence = 1.0)

### Q3: Source Priority ✅
See **Source Priority & Conflict Resolution** table in DB + Backend.
- Key insight: Stats are NOT comparable across leagues (different rules/categories)
- Store separately, display together

---

## Deferred Decisions

### Q4: Graph Data Volume ⏸️
**Status**: Backlogged until graph visualization implemented
**Notes**: Estimate ~2000-3000 nodes max (500 PLL + 800 MLL legacy + unknown NLL/MSL/WLA)

### Q5: AI Cost Model ⏸️
**Status**: Backlogged until AI interface functional
**Notes**: Decide between subscription absorption vs pass-through when usage patterns known
