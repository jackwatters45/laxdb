# @laxdb/pipeline

Effect-TS based data pipeline for web scraping, API consumption, and HTML parsing.

## Overview

This package wraps external APIs and web scraping sources to create a unified data ingestion layer for laxdb. Rather than scattering fetch calls throughout the codebase, we centralize all external data access here with:

- **Schema validation** - Every API response is validated against Effect Schema definitions, catching API changes early
- **Error handling** - Typed errors (`HttpError`, `NetworkError`, `RateLimitError`, etc.) with automatic retry logic
- **Rate limiting** - Built-in backoff and retry strategies to respect external API limits
- **Testability** - Clients can be mocked for testing without hitting real APIs

### Architecture

```
External Sources          Pipeline Package              Core Database
┌─────────────────┐      ┌─────────────────────┐      ┌─────────────────┐
│  PLL API        │─────▶│  PLLClient          │      │                 │
│  (GraphQL/REST) │      │  - Schema validation│      │  players table  │
└─────────────────┘      │  - Error handling   │─────▶│  games table    │
                         │  - Retry logic      │      │  teams table    │
┌─────────────────┐      └─────────────────────┘      │                 │
│  NLL Website    │─────▶│  ScraperService     │      └─────────────────┘
│  (HTML scraping)│      │  ParserService      │─────▶│  (future)       │
└─────────────────┘      └─────────────────────┘      └─────────────────┘
```

### Capabilities

1. **API Client** - Generic HTTP client for consuming external JSON APIs (PLL, etc.)
2. **Web Scraping** - HTML fetching and parsing with Cheerio

## Installation

```bash
bun add @laxdb/pipeline
```

## Quick Start

### API Client (JSON APIs)

```typescript
import { ApiClient } from "@laxdb/pipeline";
import { Effect, Schema } from "effect";

// Define your response schema
class UserResponse extends Schema.Class<UserResponse>("UserResponse")({
  id: Schema.Number,
  name: Schema.String,
}) {}

const program = Effect.gen(function* () {
  const client = yield* ApiClient;
  
  const user = yield* client.get("/users/1", UserResponse);
  console.log(user.name);
});
```

### PLL API (Premier Lacrosse League)

```typescript
import { PLLClient } from "@laxdb/pipeline";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const pll = yield* PLLClient;
  
  const standings = yield* pll.getStandings({ year: 2024, champSeries: false });
  console.log(`${standings.length} teams`);
});

Effect.runPromise(program.pipe(Effect.provide(PLLClient.Default)));
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

## Data Sources

### Currently Implemented

| Source | Module | Status |
|--------|--------|--------|
| PLL (Premier Lacrosse League) | `src/pll/` | Standings |

### Planned

| Source | Data Types | Priority |
|--------|------------|----------|
| PLL | Players, Games, Stats, Rosters | High |
| NLL (National Lacrosse League) | Standings, Players, Games | Medium |
| NCAA Lacrosse | Teams, Schedules, Rankings | Medium |
| USL (US Lacrosse) | Club directories, Events | Low |

## Next Steps

### Phase 1: Expand PLL API (Current)

- [ ] Extract generic `ApiClient` service from `PLLClient`
- [ ] Add PLL endpoints: `/players`, `/games`, `/teams`, `/rosters`
- [ ] Add response schemas for each endpoint
- [ ] Add tests with mocked responses

### Phase 2: Data Integration

- [ ] Create schemas in `@laxdb/core` for external data (players, games, etc.)
- [ ] Build sync service to import PLL data into database
- [ ] Add deduplication logic (match external players to internal records)
- [ ] Track data freshness and sync timestamps

### Phase 3: Additional Data Sources

- [ ] Research NLL API (if available) or scraping requirements
- [ ] Research NCAA data sources
- [ ] Add source-specific clients following PLL pattern

### Phase 4: Automation

- [ ] Create CLI for manual data sync (`bun pipeline sync pll`)
- [ ] Add Cloudflare Workers cron trigger for scheduled syncs
- [ ] Add webhook support for real-time updates (if available)
- [ ] Implement rate limiting and backoff strategies

### Phase 5: Data Quality

- [ ] Add data validation and anomaly detection
- [ ] Create admin dashboard for sync status
- [ ] Add alerts for sync failures
- [ ] Implement data versioning/history

## API Reference

### ApiClient

Generic HTTP client for JSON APIs with schema validation.

```typescript
interface ApiClient {
  get<T>(endpoint: string, schema: Schema<T>): Effect<T, ApiError>;
  post<T>(endpoint: string, body: unknown, schema: Schema<T>): Effect<T, ApiError>;
}
```

### ScraperService

Web page fetching with retry logic.

```typescript
interface ScraperService {
  scrape(request: ScrapeRequest): Effect<ScrapeResponse, ScraperError>;
  scrapeBatch(request: BatchScrapeRequest): Effect<ScrapeResponse[], ScraperError>;
  ping(url: string): Effect<boolean, ScraperError>;
}
```

### ParserService

HTML parsing with Cheerio.

```typescript
interface ParserService {
  parse(request: ParseRequest): Effect<ParsedHtml, ParserError>;
  querySelector(html: string, selector: string): Effect<Element[], ParserError>;
  extractText(html: string): Effect<string, ParserError>;
  extractLinks(html: string, baseUrl?: string): Effect<ExtractedLink[], ParserError>;
}
```

## Configuration

Environment variables (all optional):

| Variable | Default | Description |
|----------|---------|-------------|
| `PIPELINE_USER_AGENT` | `laxdb-pipeline/1.0` | HTTP User-Agent header |
| `PIPELINE_DEFAULT_TIMEOUT_MS` | `30000` | Request timeout |
| `PIPELINE_MAX_RETRIES` | `3` | Retry attempts |
| `PIPELINE_RETRY_DELAY_MS` | `1000` | Base retry delay |
| `PIPELINE_MAX_CONCURRENCY` | `5` | Batch concurrency limit |

## Development

```bash
# Run example
bun src/example-pll.ts

# Type check
bun run typecheck

# Run tests
bun run test

# Lint + format
bun run fix
```
