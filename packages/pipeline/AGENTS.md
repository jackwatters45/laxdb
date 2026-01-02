# @laxdb/pipeline - Data Pipeline

Effect-TS based data pipeline for consuming external APIs and web scraping.

## STRUCTURE

```
src/
├── api-client/              # REST and GraphQL clients
│   ├── rest-client.schema.ts   # REST client config/options schemas
│   ├── rest-client.service.ts  # makeRestClient (REST)
│   ├── api-client.error.ts     # Shared API errors (REST + GraphQL)
│   ├── graphql.schema.ts       # GraphQL schemas
│   └── graphql.service.ts      # makeGraphQLClient
├── scraper/                 # Web scraping module
│   ├── scraper.schema.ts       # Scrape request/response schemas
│   ├── scraper.error.ts        # Scraper-specific errors
│   ├── scraper.client.ts       # Low-level HTTP client
│   └── scraper.service.ts      # ScraperService
├── parser/                  # HTML parsing module
│   ├── parser.schema.ts        # Parsed content schemas
│   ├── parser.error.ts         # Parser errors
│   └── parser.service.ts       # ParserService (Cheerio)
├── pll/                     # Premier Lacrosse League client
│   ├── pll.schema.ts           # PLL-specific schemas
│   ├── pll.error.ts            # PLL API errors
│   ├── pll.client.ts           # PLLClient service
│   ├── pll.test.ts             # Integration tests
│   └── index.ts                # PLL exports
├── config.ts                # PipelineConfig service
├── error.ts                 # Shared error types
└── index.ts                 # Public exports
```

## ADDING A NEW ENDPOINT/QUERY

Follow these steps to add a new endpoint to an existing data source (e.g., PLL).

### Step 1: Capture the API Request

Use browser DevTools Network tab to capture:
- Request URL and method
- Request headers (auth tokens, content-type)
- Request body (for POST/GraphQL)
- Response body structure

### Step 2: Define Response Schema

In `{source}.schema.ts`, create Effect Schema classes for the response:

```typescript
// For simple fields
export class PLLGame extends Schema.Class<PLLGame>("PLLGame")({
  gameId: Schema.String,
  homeTeam: Schema.String,
  awayTeam: Schema.String,
  homeScore: Schema.Number,
  awayScore: Schema.Number,
  date: Schema.String,
}) {}

// For nullable fields
locationCode: Schema.NullOr(Schema.String),

// For optional fields (may not be present)
stats: Schema.optional(PLLPlayerStats),

// For arrays
allTeams: Schema.Array(PLLPlayerTeam),

// For fields that come as strings but should be numbers
const NumberFromString = Schema.transform(
  Schema.String,
  Schema.Number,
  { decode: (s) => Number(s), encode: (n) => String(n) },
);
statValue: NumberFromString,
```

### Step 3: Define Request Schema

```typescript
export class PLLGamesRequest extends Schema.Class<PLLGamesRequest>(
  "PLLGamesRequest",
)({
  season: Schema.Number,
  teamId: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Number),
}) {}
```

### Step 4: Define GraphQL Query (if applicable)

In `{source}.client.ts`, add the query string:

```typescript
const GAMES_QUERY = `
query($season: Int!, $teamId: String, $limit: Int) {
  games(season: $season, teamId: $teamId, limit: $limit) {
    gameId
    homeTeam
    awayTeam
    homeScore
    awayScore
    date
  }
}
`;
```

### Step 5: Add Method to Client

Add the new method to the client service:

```typescript
export class PLLClient extends Effect.Service<PLLClient>()("PLLClient", {
  effect: Effect.succeed({
    // ... existing methods ...

    getGames: (
      input: typeof PLLGamesRequest.Type,
    ): Effect.Effect<readonly PLLGame[], ApiClientError | GraphQLError> =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(PLLGamesRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );
        const response = yield* graphqlClient.query(GAMES_QUERY, PLLGamesResponse, {
          season: request.season,
          teamId: request.teamId,
          limit: request.limit,
        });
        return response.games;
      }).pipe(
        Effect.tap((games) =>
          Effect.log(`Fetched ${games.length} games for ${input.season}`),
        ),
      ),
  }),
}) {}
```

### Step 6: Add Tests

In `{source}.test.ts`, add integration tests:

```typescript
describe("getGames", () => {
  it("fetches 2024 games", async () => {
    const program = Effect.gen(function* () {
      const pll = yield* PLLClient;
      return yield* pll.getGames({ season: 2024, limit: 5 });
    });

    const games = await Effect.runPromise(
      program.pipe(Effect.provide(PLLClient.Default)),
    );

    expect(games.length).toBe(5);
    expect(games[0]).toHaveProperty("gameId");
    expect(games[0]).toHaveProperty("homeTeam");
  });

  it("returns games with expected properties", async () => {
    const program = Effect.gen(function* () {
      const pll = yield* PLLClient;
      return yield* pll.getGames({ season: 2024, limit: 1 });
    });

    const games = await Effect.runPromise(
      program.pipe(Effect.provide(PLLClient.Default)),
    );

    const game = games[0]!;
    expect(game.gameId).toBeTypeOf("string");
    expect(game.homeScore).toBeTypeOf("number");
  });
});
```

### Step 7: Run Tests

```bash
cd packages/pipeline
bun run test
```

### Step 8: Export (if needed)

Add to `{source}/index.ts` and `src/index.ts` if the schema should be public.

## ADDING A NEW DATA SOURCE

To add an entirely new API source (e.g., NLL):

1. Create directory: `src/nll/`
2. Create `nll.schema.ts` with response schemas
3. Create `nll.error.ts` (optional, can use shared errors)
4. Create `nll.client.ts`:

```typescript
import { Effect } from "effect";
import { makeRestClient } from "../api-client/rest-client.service";
import { makeGraphQLClient } from "../api-client/graphql.service";

const nllRestClient = makeRestClient({
  baseUrl: "https://api.nll.com/v1",
  authHeader: "Bearer TOKEN",
  defaultHeaders: {
    origin: "https://nll.com",
  },
});

const nllGraphQLClient = makeGraphQLClient({
  endpoint: "https://api.nll.com/graphql",
  authHeader: "Bearer TOKEN",
});

export class NLLClient extends Effect.Service<NLLClient>()("NLLClient", {
  effect: Effect.succeed({
    getStandings: (input) => /* ... */,
  }),
}) {}
```

5. Create `nll.test.ts` with integration tests

## COMMON SCHEMA PATTERNS

| API Returns | Schema Type |
|-------------|-------------|
| `"value"` (always present) | `Schema.String` |
| `123` (always present) | `Schema.Number` |
| `"value"` or `null` | `Schema.NullOr(Schema.String)` |
| Field may be missing | `Schema.optional(Schema.String)` |
| `"123"` but want number | `NumberFromString` (custom transform) |
| `["a", "b"]` | `Schema.Array(Schema.String)` |
| Nested object | Create separate Schema.Class |
| Union types | `Schema.Union(TypeA, TypeB)` |
| Literal values | `Schema.Literal("regular", "post")` |

## ERROR TYPES

All errors are Effect Schema TaggedErrors from `src/error.ts`:

| Error | Required Fields | Optional Fields | When Used |
|-------|-----------------|-----------------|-----------|
| `HttpError` | `message`, `url` | `method`, `statusCode`, `cause` | Non-2xx HTTP response |
| `NetworkError` | `message`, `url` | `cause` | Connection/DNS failures |
| `TimeoutError` | `message`, `url` | `timeoutMs` | Request timeout |
| `RateLimitError` | `message`, `url` | `retryAfterMs` | HTTP 429 response |
| `ParseError` | `message` | `url`, `cause` | Schema validation failure |

**Note**: `url` is required for all network errors since they occur after a request is initiated. `ParseError` has optional `url` because it's also used for input validation (before any request).

### Retry Behavior

The REST client (`makeRestClient`) handles retries automatically:
- **Transient errors** (`NetworkError`, `TimeoutError`): Exponential backoff, max 3 retries
- **Rate limiting** (`RateLimitError`): Respects server's `retry-after` header, single retry

## ANTI-PATTERNS

- **Hardcoded credentials**: Use config service or environment variables
- **Skip schema validation**: Always decode API responses with Effect Schema
- **Direct fetch calls**: Use `makeRestClient` for REST, `makeGraphQLClient` for GraphQL
- **Ignore rate limits**: Retry logic is built-in, but respect API limits
- **Effect.catchAll**: Use `Effect.catchTag` to preserve error types
- **Guessing schema types**: Always verify against actual API responses

## COMMANDS

Commands require Infisical for API credentials:

```bash
infisical run --env=dev -- bun src/example-pll.ts   # Run PLL example
infisical run --env=dev -- bun run test             # Run tests
bun run typecheck                                    # Type check
bun run fix                                          # Lint + format

# Data extraction
infisical run --env=dev -- bun src/extract/extract-all-player-details.ts
infisical run --env=dev -- bun src/extract/extract-remaining.ts
infisical run --env=dev -- bun src/extract/extract-career-stats.ts

# Data validation
infisical run --env=dev -- bun src/validate/validate-pll.ts
```

## VALIDATION

The `src/validate/` module provides reusable validators for extracted data.

### Running Validation

```bash
infisical run --env=dev -- bun src/validate/validate-pll.ts
```

### Validation Checks

| Check | Description |
|-------|-------------|
| `file_exists` | Verifies file exists and captures size |
| `json_parse` | Validates JSON structure and record count |
| `required_fields` | Checks for null/undefined required fields |
| `unique_field` | Detects duplicate values in ID fields |
| `cross_reference` | Validates foreign key relationships between datasets |

### Validation Report

Outputs a JSON report to `output/pll/validation-report.json` with:
- File-level checks and issues
- Cross-reference match rates
- Summary statistics (errors, warnings, info)
- Overall validity status

### Adding New Validators

```typescript
import { validateJsonArray, validateRequiredFields, crossReference } from "./validate.service";

const { result, data } = yield* validateJsonArray<MyType>(filePath, minRecords);
const fieldCheck = yield* validateRequiredFields(data, ["id", "name"]);
const xref = yield* crossReference(sourceData, targetData, "foreignKey", "id", "source.json", "target.json");
```

## PLL API REFERENCE

### Environment Variables

Required (stored in Infisical):
- `PLL_REST_TOKEN` - REST API bearer token
- `PLL_GRAPHQL_TOKEN` - GraphQL API bearer token

### REST API

Base URL: `https://api.stats.premierlacrosseleague.com/api/v4`

Endpoints:
- `GET /standings?year={year}&champSeries={bool}` - Team standings

### GraphQL API

Endpoint: `https://api.stats.premierlacrosseleague.com/graphql`

Queries:
- `standings(season, champSeries)` - Team standings with nested team object
- `allPlayers(season, league, includeZPP, limit)` - Players with stats
- `playerStatLeaders(year, seasonSegment, statList, limit)` - Stat leaders

### PLLClient Methods

| Method | Type | Status | Description |
|--------|------|--------|-------------|
| `getStandings` | REST | ✅ | Team standings |
| `getStandingsGraphQL` | GraphQL | ✅ | Standings with nested team |
| `getPlayers` | GraphQL | ✅ | Players with reg/post/champSeries stats |
| `getAdvancedPlayers` | GraphQL | ✅ | Players with advanced stats (rate, handedness) |
| `getStatLeaders` | GraphQL | ✅ | Stat leaders by category |
| `getTeams` | GraphQL | ✅ | Teams with stats |
| `getCareerStats` | GraphQL | ✅ | Career stat leaders |
| `getPlayerDetail` | GraphQL | ✅ | Player detail with stats, career, accolades |
| `getTeamDetail` | GraphQL | ✅ | Team detail with events, coaches |
| `getTeamStats` | GraphQL | ✅ | Team stats by segment |
| `getEvents` | REST | ✅ | Game events |
| `getEventDetail` | GraphQL | ✅ | Event with play-by-play logs |

### Development Scripts

| Script | Usage | Description |
|--------|-------|-------------|
| `introspect.ts` | `infisical run --env=dev -- bun src/pll/introspect.ts [slug]` | Probe event detail queries |
| `extract-queries.ts` | `bun src/pll/extract-queries.ts` | Extract GraphQL queries from client |
