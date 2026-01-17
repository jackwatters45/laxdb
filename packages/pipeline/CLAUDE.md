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
│   ├── pll/                    # PLL-specific extractors
│   ├── run.ts                  # CLI entry point
│   └── *.ts                    # Extraction scripts
├── validate/                # Data validation
│   ├── validate.service.ts     # Reusable validators
│   ├── validate-pll.ts         # PLL validation script
│   └── *.test.ts               # Validation tests
├── pll/                     # Premier Lacrosse League client
│   ├── pll.client.ts           # PLLClient service
│   ├── pll.schema.ts           # Response schemas
│   └── pll.integration.test.ts # Integration tests
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

# Data extraction
infisical run --env=dev -- bun src/extract/run.ts

# Data validation
infisical run --env=dev -- bun src/validate/validate-pll.ts
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

## VALIDATION

Run validation on extracted data:

```bash
infisical run --env=dev -- bun src/validate/validate-pll.ts
```

Outputs `data/pll/validation-report.json` with:
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
