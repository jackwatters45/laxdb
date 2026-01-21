# @laxdb/pipeline - Data Pipeline

> **When to read:** External data sources, PLL API, data validation/scraping.

Effect-TS based data pipeline for consuming external APIs and web scraping.

## STRUCTURE

```
src/
├── api-client/              # REST and GraphQL clients
│   ├── rest-client.service.ts  # makeRestClient
│   ├── graphql.service.ts      # makeGraphQLClient
│   └── *.test.ts               # Client tests
├── extract/                 # Data extraction
│   ├── pll/                    # PLL-specific extractors (run.ts, manifest, etc.)
│   ├── nll/                    # NLL-specific extractors
│   ├── mll/                    # MLL-specific extractors
│   ├── msl/                    # MSL-specific extractors
│   ├── wla/                    # WLA-specific extractors
│   ├── extract.schema.ts       # Shared extraction types
│   ├── incremental.service.ts  # Incremental extraction logic
│   └── season-config.ts        # Current vs historical season config
├── validate/                # Data validation
│   ├── validate.service.ts     # Reusable validators
│   ├── validate-pll.ts         # PLL validation script
│   ├── validate-nll.ts         # NLL validation script
│   └── *.test.ts               # Validation tests
├── pll/                     # Premier Lacrosse League client
│   ├── pll.client.ts           # PLLClient service
│   ├── pll.schema.ts           # Response schemas
│   └── pll.integration.test.ts # Integration tests
├── nll/                     # National Lacrosse League client
│   ├── nll.client.ts           # NLLClient service
│   ├── nll.schema.ts           # Response schemas
│   └── nll.integration.test.ts # Integration tests
├── mll/                     # Major League Lacrosse client
│   ├── mll.client.ts           # MLLClient service
│   ├── mll.schema.ts           # Response schemas
│   └── mll.integration.test.ts # Integration tests
├── wla/                     # Western Lacrosse Association client
│   ├── wla.client.ts           # WLAClient service
│   ├── wla.schema.ts           # Response schemas
│   └── wla.integration.test.ts # Integration tests
├── scraper/                 # Web scraping
├── parser/                  # HTML parsing (Cheerio)
├── config.ts                # Configuration
└── error.ts                 # Shared error types
```

## COMMANDS

```bash
# Tests (requires API credentials)
infisical run --env=dev -- bun run test

# Type check
bun run typecheck

# Lint + format
bun run fix

# PLL data extraction (requires credentials)
infisical run --env=dev -- bun src/extract/pll/run.ts

# NLL data extraction (no credentials needed)
bun src/extract/nll/run.ts

# PLL data validation
infisical run --env=dev -- bun src/validate/validate-pll.ts

# NLL data validation (no credentials needed)
bun src/validate/validate-nll.ts

# MLL data extraction (no credentials needed)
bun src/extract/mll/run.ts

# MLL data validation (no credentials needed)
bun src/validate/validate-mll.ts

# MSL data extraction (no credentials needed)
bun src/extract/msl/run.ts

# MSL data validation (no credentials needed)
bun src/validate/validate-msl.ts

# WLA data extraction (no credentials needed)
bun src/extract/wla/run.ts

# WLA data validation (no credentials needed)
bun src/validate/validate-wla.ts
```

## ADDING A NEW ENDPOINT

See `docs/ADDING_DATA_SOURCE.md` for detailed guide.

Quick summary:
1. Capture request from browser DevTools
2. Define response schema in `{source}.schema.ts`
3. Define request schema
4. Add GraphQL query or REST path
5. Implement client method
6. Add integration tests

## PLLCLIENT METHODS

| Method | Type | Description |
|--------|------|-------------|
| `getStandings` | REST | Team standings |
| `getStandingsGraphQL` | GraphQL | Standings with nested team |
| `getPlayers` | GraphQL | Players with stats |
| `getAdvancedPlayers` | GraphQL | Advanced stats (rate, handedness) |
| `getStatLeaders` | GraphQL | Stat leaders by category |
| `getTeams` | GraphQL | Teams with coaches, stats |
| `getCareerStats` | GraphQL | Career stat leaders |
| `getPlayerDetail` | GraphQL | Player detail with career, accolades |
| `getTeamDetail` | GraphQL | Team detail with events, coaches |
| `getTeamStats` | GraphQL | Team stats by segment |
| `getEvents` | REST | Game events |
| `getEventDetail` | GraphQL | Event with play-by-play logs |

## NLLCLIENT METHODS

| Method | Type | Description |
|--------|------|-------------|
| `getTeams` | REST | Teams for a season |
| `getPlayers` | REST | Players with stats |
| `getStandings` | REST | Team standings |
| `getSchedule` | REST | Season schedule (matches) |

> **Note:** NLL API is public - no credentials required.

## MLLCLIENT METHODS

| Method | Source | Description |
|--------|--------|-------------|
| `getTeams` | StatsCrew | Teams for a season (2001-2020) |
| `getPlayers` | StatsCrew | Players with stats |
| `getGoalies` | StatsCrew | Goalies with stats |
| `getStandings` | StatsCrew | Team standings |
| `getStatLeaders` | StatsCrew | Stat leaders by category |
| `getSchedule` | Wayback | Season schedule from archived pages |

> **Note:** MLL data via StatsCrew + Wayback Machine scraping - no credentials needed.
> Schedule data from Wayback may have gaps (especially 2007-2019).

## MSLCLIENT METHODS

| Method | Source | Description |
|--------|--------|-------------|
| `getTeams` | Gamesheet | Teams for a season |
| `getPlayers` | Gamesheet | Players with stats (paginated) |
| `getGoalies` | Gamesheet | Goalies with stats (paginated) |
| `getStandings` | Gamesheet | Team standings |
| `getSchedule` | Gamesheet | Season schedule (games with scores) |

> **Note:** MSL data via Gamesheet API scraping - no credentials needed.

## WLACLIENT METHODS

| Method | Source | Description |
|--------|--------|-------------|
| `getTeams` | Pointstreak | Teams for a season (2005-2025) |
| `getPlayers` | Pointstreak | Players with stats (field players) |
| `getGoalies` | Pointstreak | Goalies with stats |
| `getStandings` | Pointstreak | Team standings |
| `getSchedule` | Pointstreak | Season schedule (games with scores) |

> **Note:** WLA data via Pointstreak/DigitalShift HTML scraping - no credentials needed.
> Website is a JavaScript SPA - data extracted from embedded HTML tables.

## MSL EXTRACTION

MSL data is scraped from Gamesheet API.

```bash
# Extract single season (default: 9567 = 2024-25)
bun src/extract/msl/run.ts

# Extract specific season by Gamesheet ID
bun src/extract/msl/run.ts --season=9567

# Extract all seasons (2023-2025)
bun src/extract/msl/run.ts --all

# Re-extract even if already done
bun src/extract/msl/run.ts --force

# Show available season IDs
bun src/extract/msl/run.ts --help
```

| Flag | Description |
|------|-------------|
| `--season=ID` | Extract specific season by Gamesheet ID (default: 9567) |
| `--all` | Extract all seasons (2023-2025) |
| `--force` | Re-extract even if already done |
| `--help` | Show available season IDs |

**Season Discovery:** Season IDs are Gamesheet-specific. To find new season IDs:
1. Visit https://www.mslax.com/
2. Navigate to standings/stats page
3. Inspect network requests to `gamesheet.app/api/`
4. Look for `season_id` parameter

| Year | Gamesheet Season ID |
|------|---------------------|
| 2025 | 9567 |
| 2024 | 6007 |
| 2023 | 3246 |

> **Note:** Output: `output/msl/{seasonId}/` with JSON files per entity type.

## WLA EXTRACTION

WLA data is scraped from Pointstreak/DigitalShift HTML.

```bash
# Extract single season (default: current year)
bun src/extract/wla/run.ts

# Extract specific season by year
bun src/extract/wla/run.ts --season=2024

# Extract all seasons (2005-2025)
bun src/extract/wla/run.ts --all

# Include schedule extraction
bun src/extract/wla/run.ts --schedule

# Re-extract even if already done
bun src/extract/wla/run.ts --force

# Full historical extraction with schedules
bun src/extract/wla/run.ts --all --schedule
```

| Flag | Description |
|------|-------------|
| `--season=YYYY` | Extract specific season by year (default: current year) |
| `--all` | Extract all seasons (2005-2025) |
| `--schedule` | Include schedule extraction |
| `--force` | Re-extract even if already done |

> **Note:** Website is a JavaScript SPA - data extracted from embedded HTML tables.
> Output: `output/wla/{year}/` with JSON files per entity type.

## MLL EXTRACTION

MLL data is scraped from StatsCrew (stats) and Wayback Machine (schedules).

```bash
# Extract single year (default: 2019)
bun src/extract/mll/run.ts

# Extract specific year
bun src/extract/mll/run.ts --year=2006

# Extract all seasons (2001-2020)
bun src/extract/mll/run.ts --all

# Include Wayback schedule extraction (slower, may have gaps)
bun src/extract/mll/run.ts --with-schedule

# Re-extract even if already done
bun src/extract/mll/run.ts --force

# Full historical extraction with schedules
bun src/extract/mll/run.ts --all --with-schedule
```

| Flag | Description |
|------|-------------|
| `--year=YYYY` | Extract specific year (default: 2019) |
| `--all` | Extract all seasons (2001-2020) |
| `--with-schedule` | Include Wayback schedule extraction |
| `--force` | Re-extract even if already done |

> **Note:** Schedule data from Wayback has gaps, especially 2007-2019.
> Output: `output/mll/{year}/` with JSON files per entity type.

## VALIDATION

Run validation on extracted data:

```bash
# PLL validation (requires credentials)
infisical run --env=dev -- bun src/validate/validate-pll.ts

# NLL validation (no credentials needed)
bun src/validate/validate-nll.ts

# MLL validation (no credentials needed)
bun src/validate/validate-mll.ts

# MSL validation (no credentials needed)
bun src/validate/validate-msl.ts

# WLA validation (no credentials needed)
bun src/validate/validate-wla.ts
```

Outputs `output/{source}/validation-report.json` with:
- File checks (exists, size, parse)
- Field validation (required, unique)
- Cross-reference checks
- Summary statistics

## SCHEMA PATTERNS

| API Returns | Schema Type |
|-------------|-------------|
| `"value"` (always present) | `Schema.String` |
| `123` (always present) | `Schema.Number` |
| `"value"` or `null` | `Schema.NullOr(Schema.String)` |
| Field may be missing | `Schema.optional(Schema.String)` |
| `"123"` but want number | Custom transform |
| `["a", "b"]` | `Schema.Array(Schema.String)` |
| Nested object | Create separate Schema.Class |

## ERROR TYPES

| Error | When Used |
|-------|-----------|
| `HttpError` | Non-2xx HTTP response |
| `NetworkError` | Connection/DNS failures |
| `TimeoutError` | Request timeout |
| `RateLimitError` | HTTP 429 response |
| `ParseError` | Schema validation failure |
| `GraphQLError` | GraphQL-specific errors |

## PROGRAMMATIC API

Extract data without CLI using Effect-based functions:

```typescript
import { extractNLL, extractPLL, extractMLL, extractMSL, extractWLA } from "@laxdb/pipeline/extract";
import { Effect } from "effect";

// Run extraction with default options
const result = await Effect.runPromise(extractNLL({ seasonId: 225 }));

// With incremental mode
const result = await Effect.runPromise(
  extractPLL({ seasonId: 2024, mode: "incremental" })
);

// Force re-extraction
const result = await Effect.runPromise(
  extractMLL({ seasonId: 2019, mode: "force" })
);
```

| Function | Parameter | Description |
|----------|-----------|-------------|
| `extractNLL` | `seasonId` | NLL season ID (e.g., 225) |
| `extractPLL` | `seasonId` | Year (e.g., 2024) |
| `extractMLL` | `seasonId` | Year (e.g., 2019) |
| `extractMSL` | `seasonId` | Gamesheet season ID (e.g., 9567) |
| `extractWLA` | `seasonId` | Year (e.g., 2024) |

Options: `{ mode: "incremental" | "force" | "skip" }`

## ENVIRONMENT

Required (stored in Infisical):
- `PLL_REST_TOKEN` - REST API bearer token
- `PLL_GRAPHQL_TOKEN` - GraphQL API bearer token

## ANTI-PATTERNS

- **Hardcoded credentials**: Use config or environment variables
- **Skip schema validation**: Always decode with Effect Schema
- **Direct fetch calls**: Use `makeRestClient` or `makeGraphQLClient`
- **Effect.catchAll**: Use `Effect.catchTag` to preserve error types
- **Guessing schema types**: Verify against actual API responses
