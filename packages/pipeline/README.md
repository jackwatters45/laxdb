# @laxdb/pipeline

Effect-TS based data pipeline for web scraping, API consumption, and HTML parsing.

## Overview

This package wraps external APIs and web scraping sources to create a unified data ingestion layer for laxdb. All external data access is centralized here with:

- **Schema validation** - Every API response is validated against Effect Schema definitions
- **Error handling** - Typed errors (`HttpError`, `NetworkError`, `RateLimitError`, etc.) with automatic retry
- **Rate limiting** - Built-in backoff and retry strategies
- **Testability** - Comprehensive integration tests for all endpoints

## Current Status

### PLL (Premier Lacrosse League) - Complete

All PLL data has been extracted and validated:

| Data | Records | Description |
|------|---------|-------------|
| Players | 502 | Full profiles with career stats, accolades |
| Teams | 53 | Team-year combinations (9 franchises) |
| Events | 269 | Games with play-by-play (58,652 plays) |
| Career Stats | 1,170 | Includes 801 MLL legacy players |
| Stat Leaders | 63 | 7 years × 9 categories |

### PLLClient Methods

| Method | Type | Description |
|--------|------|-------------|
| `getStandings` | REST | Team standings |
| `getStandingsGraphQL` | GraphQL | Standings with nested team |
| `getPlayers` | GraphQL | Players with reg/post/champSeries stats |
| `getAdvancedPlayers` | GraphQL | Advanced stats (rate, handedness) |
| `getStatLeaders` | GraphQL | Stat leaders by category |
| `getTeams` | GraphQL | Teams with coaches, stats |
| `getCareerStats` | GraphQL | Career stat leaders |
| `getPlayerDetail` | GraphQL | Player detail with career, accolades |
| `getTeamDetail` | GraphQL | Team detail with events, coaches |
| `getTeamStats` | GraphQL | Team stats by segment |
| `getEvents` | REST | Game events |
| `getEventDetail` | GraphQL | Event with play-by-play logs |

## Quick Start

### PLL API

```typescript
import { PLLClient } from "@laxdb/pipeline";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const pll = yield* PLLClient;
  
  // Get standings
  const standings = yield* pll.getStandings({ year: 2024, champSeries: false });
  
  // Get players with stats
  const players = yield* pll.getPlayers({ 
    season: 2024, 
    includeReg: true,
    limit: 50 
  });
  
  // Get player detail
  const player = yield* pll.getPlayerDetail({ 
    slug: "jeff-teat",
    statsYear: 2024 
  });
});

await Effect.runPromise(program.pipe(Effect.provide(PLLClient.Default)));
```

### Web Scraping

```typescript
import { ScraperService, ParserService } from "@laxdb/pipeline";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const scraper = yield* ScraperService;
  const parser = yield* ParserService;

  const response = yield* scraper.scrape({ url: "https://example.com" });
  const parsed = yield* parser.parse({ html: response.body });
  
  console.log(parsed.title);
});
```

## Project Structure

```
src/
├── api-client/           # REST and GraphQL clients
├── extract/              # Data extraction scripts
│   ├── pll/              # PLL-specific extractors
│   └── run.ts            # CLI entry point
├── validate/             # Data validation system
├── pll/                  # PLL API client
├── scraper/              # Web scraping
├── parser/               # HTML parsing (Cheerio)
└── config.ts             # Configuration
```

## Commands

```bash
# Run tests
infisical run --env=dev -- bun run test

# Type check
bun run typecheck

# Lint + format
bun run fix

# Data extraction
infisical run --env=dev -- bun src/extract/run.ts

# Data validation
infisical run --env=dev -- bun src/validate/validate-pll.ts
```

## Environment Variables

Required (stored in Infisical):
- `PLL_REST_TOKEN` - PLL REST API bearer token
- `PLL_GRAPHQL_TOKEN` - PLL GraphQL API bearer token

## Output Files

Extracted data is stored in `data/pll/`:

```
data/pll/
├── {year}/
│   ├── teams.json
│   ├── players.json
│   ├── advanced-players.json
│   ├── events.json
│   └── standings.json
├── player-details.json      # 502 players with career stats
├── team-details.json        # 53 team-years with coaches
├── event-details.json       # 269 events with play-by-play
├── career-stats.json        # 1,170 career stat leaders
├── stat-leaders.json        # Historical stat leaders
└── validation-report.json   # Validation results
```

## Next Steps

See `TODO.md` for current work items and `docs/PLL_DATA_MODEL.md` for complete data documentation.
