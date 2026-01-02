# External League Data - Implementation Plan

**Goal**: Aggregate data from professional lacrosse leagues (PLL, NLL, etc.) into a browsable dashboard.

**Current Focus**: Data extraction and sync to DB. Keep everything in `@laxdb/pipeline` for now.

**Deferred**: API/RPC layer, web routes (come after we have solid data extraction + sync).

---

## Phase 0: Data Discovery & Extraction Map

### What We Have (PLL Client)

The `PLLClient` is complete with these endpoints:

| Method | Type | Returns |
|--------|------|---------|
| `getStandings` | REST | Team standings for a season |
| `getStandingsGraphQL` | GraphQL | Standings with nested team object |
| `getPlayers` | GraphQL | All players with reg/post/champSeries stats |
| `getAdvancedPlayers` | GraphQL | Players with advanced stats (rate, handedness) |
| `getStatLeaders` | GraphQL | Stat leaders by category |
| `getTeams` | GraphQL | Teams with coaches, stats |
| `getCareerStats` | GraphQL | Career stat leaders |
| `getPlayerDetail` | GraphQL | Single player: stats, career, accolades, allSeasonStats |
| `getTeamDetail` | GraphQL | Single team: events, coaches, stats |
| `getTeamStats` | GraphQL | Team stats for a specific segment |
| `getEvents` | REST | All events/games for a season |
| `getEventDetail` | GraphQL | Single event with play-by-play logs |

### What We're Missing: Complete Data Extraction

The endpoints above get data, but we need to understand:
1. **What endpoints to call** to get ALL data
2. **In what order** (dependency graph)
3. **What data lives on list endpoints vs detail endpoints**

### Data Extraction Graph

```
Season (2019-2025)
├── getTeams(year) → Team[]
│   └── getTeamDetail(id, year) → Full team with events, coaches
│       └── events[] → getEventDetail(slug) → Play-by-play
│
├── getPlayers(season) → Player[] (with current stats)
│   └── getPlayerDetail(slug, year) → Full player with:
│       ├── allSeasonStats[] (historical stats per year/segment)
│       ├── careerStats
│       ├── accolades
│       └── advancedSeasonStats
│
├── getStandings(year) → Standings with embedded team
│
├── getEvents(year) → Event[] (games)
│   └── getEventDetail(slug) → Full event with playLogs
│
└── getStatLeaders(year, stat[]) → Leaderboards
```

### Phase 0 Tasks

- [ ] **Document all available fields per endpoint** (create `DATA_DICTIONARY.md`)
- [ ] **Map what's unique to detail endpoints** vs available in list endpoints
- [ ] **Identify pagination/limits** - do any endpoints have hidden limits?
- [ ] **Rate limit testing** - how many requests can we make?
- [ ] **Historical data availability** - what years have data? (PLL started 2019)

### Investigation Script

Create `packages/pipeline/src/pll/explore-data.ts`:

```typescript
// Exploration script to understand data completeness
// 1. How many teams per year?
// 2. How many players per year?
// 3. How many events per year?
// 4. What fields are null vs populated?
// 5. What's the difference between list and detail endpoints?
```

---

## Phase 1: Complete Data Extraction

### Goal
Extract ALL available data from PLL API for all seasons (2019-2025).
Output: JSON files per entity type, per season.

### Location: `packages/pipeline/src/extract/`

```
extract/
├── extract.service.ts      # Orchestrator for full extraction
├── extract.schema.ts       # Output file schemas
├── extract.config.ts       # Rate limits, output paths
├── pll/
│   ├── pll.extractor.ts    # PLL-specific extraction logic
│   ├── pll.manifest.ts     # Track what's been extracted
│   └── index.ts
└── index.ts
```

### 1.1 Extraction Strategy

For each season (2019-2025):

```typescript
// Step 1: Get all teams (list)
const teams = await pll.getTeams({ year });
saveJson(`output/pll/${year}/teams.json`, teams);

// Step 2: Get team details (parallel, with rate limiting)
const teamDetails = await Promise.all(
  teams.map(t => pll.getTeamDetail({ id: t.officialId, year }))
);
saveJson(`output/pll/${year}/team-details.json`, teamDetails);

// Step 3: Get all players
const players = await pll.getPlayers({ season: year, limit: 1000 });
saveJson(`output/pll/${year}/players.json`, players);

// Step 4: Get player details (expensive - many players)
// Consider: Do we need all details, or is list endpoint enough?
// Detail adds: allSeasonStats, careerStats, accolades

// Step 5: Get all events
const events = await pll.getEvents({ year });
saveJson(`output/pll/${year}/events.json`, events);

// Step 6: Get event details (for play-by-play data)
const eventDetails = await Promise.all(
  events.map(e => pll.getEventDetail({ slug: e.slugname }))
);
saveJson(`output/pll/${year}/event-details.json`, eventDetails);

// Step 7: Get standings
const standings = await pll.getStandings({ year, champSeries: false });
saveJson(`output/pll/${year}/standings.json`, standings);

// Step 8: Get champ series standings
const csStandings = await pll.getStandings({ year, champSeries: true });
saveJson(`output/pll/${year}/standings-cs.json`, csStandings);
```

### 1.2 Rate Limiting & Parallelization

```typescript
// extract.config.ts
export const extractConfig = {
  pll: {
    concurrency: 5,          // Max parallel requests
    delayBetweenMs: 200,     // Delay between batches
    retryAttempts: 3,
    outputDir: "./output/pll",
  },
};
```

### 1.3 Manifest Tracking

Track extraction progress to enable resumption:

```typescript
// pll.manifest.ts
interface ExtractionManifest {
  source: "pll";
  seasons: {
    [year: number]: {
      teams: { extracted: boolean; count: number; timestamp: string };
      teamDetails: { extracted: boolean; count: number; timestamp: string };
      players: { extracted: boolean; count: number; timestamp: string };
      playerDetails: { extracted: boolean; count: number; timestamp: string };
      events: { extracted: boolean; count: number; timestamp: string };
      eventDetails: { extracted: boolean; count: number; timestamp: string };
      standings: { extracted: boolean; timestamp: string };
    };
  };
  lastRun: string;
}
```

### 1.4 CLI Commands

```bash
# Full extraction for all years
bun src/extract/run.ts --source=pll --all

# Single year extraction
bun src/extract/run.ts --source=pll --year=2024

# Resume incomplete extraction
bun src/extract/run.ts --source=pll --resume

# Extract specific entity type only
bun src/extract/run.ts --source=pll --year=2024 --entity=players
```

### Phase 1 Tasks

- [ ] Create `extract/` module structure
- [ ] Implement extraction service with rate limiting
- [ ] Implement manifest tracking for resumption
- [ ] Test extraction for 2024 season
- [ ] Validate extracted data completeness
- [ ] Run full extraction for 2019-2025
- [ ] Document data gaps or issues found

---

## Phase 2: Database Schema & Sync

### Goal
Sync extracted data into database. Keep schema in `@laxdb/pipeline` for now.
Move to `@laxdb/core` later when stable.

### Location: `packages/pipeline/src/db/`

```
db/
├── schema/
│   ├── league.sql.ts           # league table
│   ├── external-team.sql.ts    # external_team table
│   ├── external-player.sql.ts  # external_player table
│   ├── external-roster.sql.ts  # player-team-season relationship
│   ├── external-game.sql.ts    # games/events
│   ├── external-standing.sql.ts
│   ├── player-stats.sql.ts     # per-season stats
│   ├── team-stats.sql.ts       # per-season team stats
│   ├── sync-log.sql.ts         # sync tracking
│   └── index.ts                # export all
├── sync/
│   ├── sync.service.ts         # SyncService
│   ├── sync.mapper.ts          # PLL → DB transforms
│   ├── sync.repo.ts            # Upsert operations
│   └── index.ts
└── migrations/
    └── ...drizzle migrations
```

### 2.1 Schema Design

Keep schema modular. Tables should support multiple leagues.

```typescript
// league.sql.ts
export const leagueTable = pgTable("league", {
  id: text("id").primaryKey(),        // "pll", "nll"
  name: text("name").notNull(),       // "Premier Lacrosse League"
  shortName: text("short_name"),      // "PLL"
  country: text("country").default("USA"),
  isActive: boolean("is_active").default(true),
  ...timestamps,
});

// external-team.sql.ts
export const externalTeamTable = pgTable("external_team", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull(),
  leagueId: text("league_id").notNull().references(() => leagueTable.id),
  name: text("name").notNull(),
  fullName: text("full_name"),
  location: text("location"),
  locationCode: text("location_code"),
  logoUrl: text("logo_url"),
  slogan: text("slogan"),
  ...timestamps,
}, (table) => [
  uniqueIndex("external_team_league_external_id").on(table.leagueId, table.externalId),
]);

// external-player.sql.ts
export const externalPlayerTable = pgTable("external_player", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull(),
  leagueId: text("league_id").notNull().references(() => leagueTable.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  lastNameSuffix: text("last_name_suffix"),
  slug: text("slug"),
  profileUrl: text("profile_url"),
  handedness: text("handedness"),
  country: text("country"),
  countryCode: text("country_code"),
  collegeYear: integer("college_year"),
  experience: integer("experience"),
  expFromYear: integer("exp_from_year"),
  isCaptain: boolean("is_captain").default(false),
  ...timestamps,
}, (table) => [
  uniqueIndex("external_player_league_external_id").on(table.leagueId, table.externalId),
  index("external_player_name").on(table.lastName, table.firstName),
]);

// external-roster.sql.ts (player-team-season junction)
export const externalRosterTable = pgTable("external_roster", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => externalPlayerTable.id),
  teamId: integer("team_id").notNull().references(() => externalTeamTable.id),
  season: integer("season").notNull(),
  jerseyNumber: integer("jersey_number"),
  position: text("position"),
  positionName: text("position_name"),
  ...timestamps,
}, (table) => [
  uniqueIndex("external_roster_player_team_season").on(table.playerId, table.teamId, table.season),
]);

// external-game.sql.ts
export const externalGameTable = pgTable("external_game", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  leagueId: text("league_id").notNull().references(() => leagueTable.id),
  season: integer("season").notNull(),
  seasonSegment: text("season_segment").default("regular"),
  homeTeamId: integer("home_team_id").references(() => externalTeamTable.id),
  awayTeamId: integer("away_team_id").references(() => externalTeamTable.id),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  startTime: timestamp("start_time"),
  week: text("week"),
  venue: text("venue"),
  venueLocation: text("venue_location"),
  status: text("status").default("scheduled"),
  broadcaster: text("broadcaster"),
  slugname: text("slugname"),
  ...timestamps,
}, (table) => [
  uniqueIndex("external_game_league_slugname").on(table.leagueId, table.slugname),
  index("external_game_season").on(table.season),
]);
```

### 2.2 Sync Service

```typescript
// sync.service.ts
export class SyncService extends Effect.Service<SyncService>()("SyncService", {
  effect: Effect.gen(function* () {
    const repo = yield* SyncRepo;
    
    return {
      // Sync from extracted JSON files
      syncFromFiles: (options: { source: string; year: number }) =>
        Effect.gen(function* () {
          const basePath = `./output/${options.source}/${options.year}`;
          
          // Sync in order (respects foreign keys)
          yield* repo.syncTeams(readJson(`${basePath}/teams.json`));
          yield* repo.syncPlayers(readJson(`${basePath}/players.json`));
          yield* repo.syncRosters(/* derive from player.allTeams */);
          yield* repo.syncGames(readJson(`${basePath}/events.json`));
          yield* repo.syncStandings(readJson(`${basePath}/standings.json`));
        }),
      
      // Sync directly from API (for incremental updates)
      syncFromApi: (options: { source: string; year: number }) =>
        Effect.gen(function* () {
          const pll = yield* PLLClient;
          // ... fetch and sync
        }),
    };
  }),
}) {}
```

### 2.3 Upsert Pattern

Use Drizzle's `onConflictDoUpdate`:

```typescript
// sync.repo.ts
syncTeams: (teams: ExternalTeamInsert[]) =>
  db.pipe(
    Effect.flatMap((d) =>
      d
        .insert(externalTeamTable)
        .values(teams)
        .onConflictDoUpdate({
          target: [externalTeamTable.leagueId, externalTeamTable.externalId],
          set: {
            name: sql`excluded.name`,
            fullName: sql`excluded.full_name`,
            // ... other fields
            updatedAt: new Date(),
          },
        })
        .returning()
    ),
  ),
```

### Phase 2 Tasks

- [ ] Create `db/` module structure
- [ ] Define all Drizzle schemas
- [ ] Create mappers (extracted JSON → DB schema)
- [ ] Implement SyncRepo with upserts
- [ ] Implement SyncService
- [ ] Generate and test migrations
- [ ] Sync 2024 data as test
- [ ] Sync all historical data (2019-2025)

---

## Phase 3: Incremental Sync & Cron

### Goal
Set up automated daily sync for current season data.

### 3.1 Sync Strategy

| Data Type | Frequency | Rationale |
|-----------|-----------|-----------|
| Teams | Weekly | Rarely changes |
| Players | Daily (in-season) | Roster moves, injuries |
| Standings | Daily (in-season) | After games |
| Games | Daily | New games, score updates |
| Stats | Daily (in-season) | After games complete |

### 3.2 Sync Worker

For now, keep sync logic in pipeline package. Eventually move to dedicated worker.

```typescript
// sync/cron.ts - Entry point for scheduled sync
export const runDailySync = Effect.gen(function* () {
  const sync = yield* SyncService;
  const currentYear = new Date().getFullYear();
  
  yield* sync.syncFromApi({ source: "pll", year: currentYear });
  
  // Log completion
  yield* Effect.log("Daily sync completed");
});
```

### 3.3 Sync Tracking

```typescript
export const syncLogTable = pgTable("sync_log", {
  id: serial("id").primaryKey(),
  leagueId: text("league_id").notNull(),
  syncType: text("sync_type").notNull(), // "teams", "players", "standings", "games"
  season: integer("season"),
  status: text("status").notNull(), // "running", "success", "failed"
  recordsProcessed: integer("records_processed").default(0),
  recordsCreated: integer("records_created").default(0),
  recordsUpdated: integer("records_updated").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  ...timestamps,
});
```

### Phase 3 Tasks

- [ ] Implement sync tracking (sync_log table)
- [ ] Create incremental sync logic (only fetch changed data)
- [ ] Add sync CLI command for manual runs
- [ ] Test incremental sync
- [ ] (Later) Add Cloudflare Worker cron trigger

---

## Phase 4: Additional Data Sources

### Goal
Add more leagues/data sources using same patterns.

### Potential Sources

| Source | Data Available | Priority |
|--------|----------------|----------|
| NLL (National Lacrosse League) | Standings, players, games | High |
| NCAA Lacrosse | Teams, schedules | Medium |
| USL (US Lacrosse) | Club directories | Low |

### NLL Investigation Needed

- [ ] Does NLL have a public API?
- [ ] If not, what's available via web scraping?
- [ ] What data structure do they use?

### Pattern for New Sources

```
pll/
├── pll.client.ts    # API client
├── pll.schema.ts    # Response schemas
├── pll.queries.ts   # GraphQL queries
└── pll.extractor.ts # Extraction logic

nll/
├── nll.client.ts    # API or scraper client
├── nll.schema.ts    # Response/page schemas
└── nll.extractor.ts # Extraction logic
```

---

## Deferred: API Layer & Web Routes

These come AFTER we have solid data extraction and sync.

### API Layer (packages/api/src/external/)

- RPC contract for querying external data
- Read-only endpoints
- Search functionality

### Web Routes (packages/web/src/routes/leagues/)

- Standings page
- Teams list + detail
- Players list + detail
- Games/schedule
- Stat leaders

See original plan sections for detailed specs when ready.

---

## Implementation Order (Updated)

### Week 1: Phase 0 - Data Discovery
- [ ] Run exploration script to understand data completeness
- [ ] Document all available fields per endpoint
- [ ] Identify what's unique to detail endpoints
- [ ] Test rate limits
- [ ] Create `DATA_DICTIONARY.md`

### Week 2: Phase 1 - Data Extraction
- [ ] Create `extract/` module
- [ ] Implement extraction with rate limiting
- [ ] Add manifest tracking
- [ ] Extract 2024 as test
- [ ] Extract all years (2019-2025)

### Week 3: Phase 2 - Database & Sync
- [ ] Create `db/` module with schemas
- [ ] Generate migrations
- [ ] Implement mappers
- [ ] Implement SyncRepo + SyncService
- [ ] Sync all historical data

### Week 4: Phase 3 - Incremental Sync
- [ ] Add sync tracking
- [ ] Implement incremental sync
- [ ] Test daily sync workflow
- [ ] CLI commands for sync

### Later:
- [ ] Phase 4: Add NLL or other sources
- [ ] Phase 5: API layer
- [ ] Phase 6: Web routes

---

## File Checklist

### Phase 0-1 (Extraction)

```
packages/pipeline/
├── src/
│   ├── extract/
│   │   ├── extract.service.ts
│   │   ├── extract.schema.ts
│   │   ├── extract.config.ts
│   │   ├── pll/
│   │   │   ├── pll.extractor.ts
│   │   │   └── pll.manifest.ts
│   │   ├── run.ts              # CLI entry point
│   │   └── index.ts
│   └── pll/
│       └── explore-data.ts     # Data exploration script
├── docs/
│   ├── EXTERNAL_LEAGUE_DATA_PLAN.md  # This file
│   └── DATA_DICTIONARY.md            # New: field documentation
└── output/                           # Extracted JSON (gitignored)
    └── pll/
        ├── 2024/
        │   ├── teams.json
        │   ├── players.json
        │   └── ...
        └── manifest.json
```

### Phase 2-3 (Sync)

```
packages/pipeline/
├── src/
│   └── db/
│       ├── schema/
│       │   ├── league.sql.ts
│       │   ├── external-team.sql.ts
│       │   ├── external-player.sql.ts
│       │   ├── external-roster.sql.ts
│       │   ├── external-game.sql.ts
│       │   ├── external-standing.sql.ts
│       │   ├── player-stats.sql.ts
│       │   ├── team-stats.sql.ts
│       │   ├── sync-log.sql.ts
│       │   └── index.ts
│       ├── sync/
│       │   ├── sync.service.ts
│       │   ├── sync.mapper.ts
│       │   ├── sync.repo.ts
│       │   └── index.ts
│       └── migrations/
├── drizzle.config.ts          # Drizzle config for pipeline DB
└── package.json               # Add drizzle-orm dependency
```
