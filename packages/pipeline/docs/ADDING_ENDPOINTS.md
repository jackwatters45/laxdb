# Adding New Endpoints

Guide for adding REST or GraphQL endpoints to an existing data source.

## Steps

1. Capture the request from browser DevTools
2. Define response schema
3. Define request schema
4. Add query/endpoint string
5. Implement client method
6. Add tests

## 1. Capture the Request

Use browser DevTools Network tab to capture:

- URL / endpoint
- Headers (auth, origin, etc.)
- Request body (for GraphQL)
- Response structure

## 2. Define Response Schema

In `{source}.schema.ts`:

```typescript
import { Schema } from "effect";

export class PLLGame extends Schema.Class<PLLGame>("PLLGame")({
  gameId: Schema.String,
  homeScore: Schema.Number,
  venue: Schema.NullOr(Schema.String),      // null allowed
  stats: Schema.optional(PLLGameStats),      // field may be missing
  players: Schema.Array(PLLPlayer),          // array of objects
}) {}

// Wrapper for GraphQL response
export class PLLGamesResponse extends Schema.Class<PLLGamesResponse>(
  "PLLGamesResponse",
)({
  games: Schema.Array(PLLGame),
}) {}
```

### Common Patterns

| API Returns | Schema |
|-------------|--------|
| `"value"` | `Schema.String` |
| `123` | `Schema.Number` |
| `null` or value | `Schema.NullOr(Schema.String)` |
| Missing field | `Schema.optional(Schema.String)` |
| `"123"` as number | See transform below |

```typescript
// String to number transform
const NumberFromString = Schema.transform(
  Schema.String,
  Schema.Number,
  { decode: (s) => Number(s), encode: (n) => String(n) },
);
```

## 3. Define Request Schema

```typescript
export class PLLGamesRequest extends Schema.Class<PLLGamesRequest>(
  "PLLGamesRequest",
)({
  season: Schema.Number,
  teamId: Schema.optional(Schema.String),
  // Optional with default
  includeStats: Schema.optionalWith(Schema.Boolean, { default: () => false }),
}) {}
```

## 4. Add Query/Endpoint

In `{source}.client.ts`:

```typescript
// GraphQL
const GAMES_QUERY = `
query($season: Int!, $teamId: String) {
  games(season: $season, teamId: $teamId) {
    gameId
    homeScore
    venue
  }
}
`;

// REST - just use the path in the method
// e.g., `/games?year=${request.year}`
```

## 5. Implement Client Method

```typescript
export class PLLClient extends Effect.Service<PLLClient>()("PLLClient", {
  effect: Effect.succeed({
    // GraphQL example
    getGames: (input: typeof PLLGamesRequest.Encoded) =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(PLLGamesRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );
        const response = yield* graphqlClient.query(GAMES_QUERY, PLLGamesResponse, {
          season: request.season,
          teamId: request.teamId,
        });
        return response.games;
      }),

    // REST example
    getStandings: (input: typeof PLLStandingsRequest.Encoded) =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(PLLStandingsRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );
        const endpoint = `/standings?year=${request.year}`;
        const response = yield* restClient.get(endpoint, PLLStandingsResponse);
        return response.data.items;
      }),
  }),
}) {}
```

Key points:
- Input type uses `.Encoded` (allows optional properties)
- Decode input first with `Schema.decode`
- No explicit return type needed

## 6. Add Tests

In `{source}.test.ts`:

```typescript
describe("getGames", () => {
  it("fetches games", async () => {
    const program = Effect.gen(function* () {
      const pll = yield* PLLClient;
      return yield* pll.getGames({ season: 2024, limit: 5 });
    });

    const games = await Effect.runPromise(
      program.pipe(Effect.provide(PLLClient.Default)),
    );

    expect(games.length).toBe(5);
    expect(games[0]).toHaveProperty("gameId");
  });
});
```

## Commands

```bash
bun run test              # Run tests
npx tsc --noEmit          # Type check
```
