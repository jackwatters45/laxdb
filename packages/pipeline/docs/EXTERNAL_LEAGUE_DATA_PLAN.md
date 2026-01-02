# External League Data - Implementation Plan

**Goal**: Aggregate data from professional lacrosse leagues (PLL, NLL, etc.) into a browsable dashboard.

**Status**: Phase 0-1 complete. Ready for database schema design.

---

## Completed Work

### Phase 0: Data Discovery - DONE

- [x] Documented all available fields per endpoint (see `PLL_DATA_MODEL.md`)
- [x] Mapped what's unique to detail endpoints vs list endpoints
- [x] Identified pagination/limits
- [x] Tested rate limits (~5 concurrent requests safe)
- [x] Confirmed historical data availability (2019-2025)

### Phase 1: Data Extraction - DONE

All PLL data extracted and validated:

| Entity | Records | Source |
|--------|---------|--------|
| Players (PLL) | 502 | player-details.json |
| Players (MLL) | 801 | career-stats.json (legacy) |
| Teams | 53 | team-details.json (team-years) |
| Events | 269 | event-details.json |
| Play Logs | 58,652 | event-details.json |
| Stat Leaders | 63 | stat-leaders.json |

### PLLClient - COMPLETE

All endpoints implemented and tested:

| Method | Type | Status |
|--------|------|--------|
| `getStandings` | REST | ✅ |
| `getStandingsGraphQL` | GraphQL | ✅ |
| `getPlayers` | GraphQL | ✅ |
| `getAdvancedPlayers` | GraphQL | ✅ |
| `getStatLeaders` | GraphQL | ✅ |
| `getTeams` | GraphQL | ✅ |
| `getCareerStats` | GraphQL | ✅ |
| `getPlayerDetail` | GraphQL | ✅ |
| `getTeamDetail` | GraphQL | ✅ |
| `getTeamStats` | GraphQL | ✅ |
| `getEvents` | REST | ✅ |
| `getEventDetail` | GraphQL | ✅ |

### Validation System - DONE

- [x] File existence and size checks
- [x] JSON parsing and record counts
- [x] Required field validation
- [x] Unique field detection (slugs, IDs)
- [x] Cross-reference validation between datasets
- [x] Data anomaly tests (stat consistency)

---

## Next Phase: Database Schema Design

### Location: `packages/core/src/` (when ready)

### Schema Considerations

1. **PLL Players (502)**: Full profiles - name, position, college, handedness, jersey history, career stats, season stats, accolades

2. **MLL Players (801)**: Career stats only - name, slug, years active, aggregate stats

3. **Bridge Players (179)**: Played in both leagues - need to merge MLL career stats with PLL profile

### Proposed Tables

```
pll_players          # 502 PLL players
pll_teams            # 9 franchises
pll_team_seasons     # 53 team-year records
pll_rosters          # player-team-year relationships
pll_events           # 269 games
pll_play_logs        # 58,652 play-by-play entries
pll_player_stats     # season stats per player
pll_career_stats     # career totals (includes MLL)
pll_accolades        # awards and honors
```

---

## Future Phases

### Phase 3: Data Import Service

- [ ] Create import service to sync JSON → database
- [ ] Player deduplication (match by slug/officialId)
- [ ] Track import timestamps for freshness
- [ ] Handle incremental updates

### Phase 4: Incremental Sync

- [ ] Daily sync for current season
- [ ] Sync tracking (sync_log table)
- [ ] CLI commands for manual sync
- [ ] (Later) Cloudflare Worker cron trigger

### Phase 5: Additional Data Sources

| Source | Priority | Status |
|--------|----------|--------|
| NLL (National Lacrosse League) | Medium | Not started |
| NCAA Lacrosse | Low | Not started |

---

## File Structure

```
packages/pipeline/
├── src/
│   ├── pll/                 # PLL API client
│   ├── extract/             # Extraction scripts
│   │   ├── pll/             # PLL extractors
│   │   └── run.ts           # CLI entry point
│   └── validate/            # Validation system
├── data/pll/                # Extracted JSON (gitignored)
│   ├── {year}/              # Per-year data
│   ├── player-details.json
│   ├── team-details.json
│   ├── event-details.json
│   ├── career-stats.json
│   └── stat-leaders.json
└── docs/
    ├── PLL_DATA_MODEL.md    # Complete data documentation
    └── ADDING_ENDPOINTS.md  # Guide for new endpoints
```

---

## Commands

```bash
# Run full extraction
infisical run --env=dev -- bun src/extract/run.ts

# Run validation
infisical run --env=dev -- bun src/validate/validate-pll.ts

# Run tests
infisical run --env=dev -- bun run test

# Lint + format
bun run fix
```
