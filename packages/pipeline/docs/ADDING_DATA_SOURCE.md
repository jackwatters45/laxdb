# Adding a New Data Source

Complete guide for adding a new external data source (e.g., NLL, NCAA) to the pipeline. This covers everything from initial research through extraction and validation.

**Prerequisites**: The data source should have either a REST/GraphQL API or scrapeable web pages.

---

## Phase 1: Discovery

### 1.1 Research the Data Source

Before writing any code, understand what's available:

- [ ] Does the source have a public API? (Check network tab in DevTools)
- [ ] What authentication is required? (API keys, tokens, cookies)
- [ ] What data entities exist? (teams, players, games, stats)
- [ ] What endpoints/pages are available?
- [ ] What's the rate limit?
- [ ] How far back does historical data go?

### 1.2 Capture Sample Requests

Use browser DevTools Network tab:

1. Open the source's website
2. Open DevTools → Network tab
3. Navigate to pages with the data you want
4. Look for XHR/Fetch requests
5. For each useful request, note:
   - URL / endpoint
   - Method (GET/POST)
   - Headers (especially auth)
   - Request body (for POST/GraphQL)
   - Response structure

Save sample responses as JSON files in `docs/samples/{source}/` for reference.

### 1.3 Create Data Model Documentation

Create `docs/{SOURCE}_DATA_MODEL.md` documenting:

```markdown
# {Source} Data Model

## API Overview

| Endpoint | Type | Returns |
|----------|------|---------|
| `/teams` | REST | Team[] |
| `players(season)` | GraphQL | Player[] |

## Core Entities

### Team
- Primary key: `id`
- Fields: name, location, logo, etc.

### Player
- Primary key: `playerId`
- Fields: name, position, team, stats, etc.

## Entity Relationships

[Diagram or description]

## Enumerated Values

| Field | Values |
|-------|--------|
| position | A, M, D, G |
| status | active, injured, retired |
```

---

## Phase 2: Client Setup

### 2.1 Create Module Structure

```
src/{source}/
├── {source}.client.ts      # API client service
├── {source}.schema.ts      # Response schemas
├── {source}.error.ts       # Source-specific errors (optional)
├── {source}.integration.test.ts
└── index.ts
```

### 2.2 Define Response Schemas

In `{source}.schema.ts`, create Effect Schema classes:

```typescript
import { Schema } from "effect";

// Simple entity
export class NLLTeam extends Schema.Class<NLLTeam>("NLLTeam")({
  id: Schema.String,
  name: Schema.String,
  city: Schema.String,
  conference: Schema.NullOr(Schema.String),
  logoUrl: Schema.optional(Schema.String),
}) {}

// Entity with nested objects
export class NLLPlayer extends Schema.Class<NLLPlayer>("NLLPlayer")({
  playerId: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  position: Schema.NullOr(Schema.String),
  team: Schema.NullOr(NLLTeam),
  stats: Schema.optional(NLLPlayerStats),
}) {}

// GraphQL response wrapper
export class NLLTeamsResponse extends Schema.Class<NLLTeamsResponse>(
  "NLLTeamsResponse",
)({
  teams: Schema.Array(NLLTeam),
}) {}
```

**Schema patterns:**

| API Returns | Schema |
|-------------|--------|
| Always present string | `Schema.String` |
| Always present number | `Schema.Number` |
| String or null | `Schema.NullOr(Schema.String)` |
| Field may be missing | `Schema.optional(Schema.String)` |
| Array | `Schema.Array(ItemSchema)` |
| String that should be number | Custom transform (see below) |

```typescript
// String to number transform
const NumberFromString = Schema.transform(
  Schema.String,
  Schema.Number,
  { decode: (s) => Number(s), encode: (n) => String(n) },
);
```

### 2.3 Define Request Schemas

```typescript
export class NLLTeamsRequest extends Schema.Class<NLLTeamsRequest>(
  "NLLTeamsRequest",
)({
  season: Schema.Number,
  conference: Schema.optional(Schema.String),
}) {}
```

### 2.4 Create API Client

In `{source}.client.ts`:

```typescript
import { Effect, Schema } from "effect";
import { makeRestClient } from "../api-client/rest-client.service";
import { makeGraphQLClient } from "../api-client/graphql.service";
import type { PipelineError } from "../error";
import * as S from "./{source}.schema";

// REST client
const restClient = makeRestClient({
  baseUrl: "https://api.nll.com/v1",
  authHeader: process.env.NLL_API_TOKEN 
    ? `Bearer ${process.env.NLL_API_TOKEN}` 
    : undefined,
  defaultHeaders: {
    origin: "https://nll.com",
  },
});

// GraphQL client (if needed)
const graphqlClient = makeGraphQLClient({
  endpoint: "https://api.nll.com/graphql",
  authHeader: process.env.NLL_GRAPHQL_TOKEN
    ? `Bearer ${process.env.NLL_GRAPHQL_TOKEN}`
    : undefined,
});

// GraphQL queries
const TEAMS_QUERY = `
query($season: Int!) {
  teams(season: $season) {
    id
    name
    city
    conference
  }
}
`;

// Helper for parse errors
const mapParseError = (e: unknown): PipelineError => ({
  _tag: "ParseError",
  message: e instanceof Error ? e.message : String(e),
});

// Client service
export class NLLClient extends Effect.Service<NLLClient>()("NLLClient", {
  effect: Effect.succeed({
    // REST example
    getStandings: (input: typeof S.NLLStandingsRequest.Encoded) =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(S.NLLStandingsRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );
        return yield* restClient.get(
          `/standings?season=${request.season}`,
          S.NLLStandingsResponse,
        );
      }),

    // GraphQL example
    getTeams: (input: typeof S.NLLTeamsRequest.Encoded) =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(S.NLLTeamsRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );
        const response = yield* graphqlClient.query(
          TEAMS_QUERY,
          S.NLLTeamsResponse,
          { season: request.season },
        );
        return response.teams;
      }),
  }),
}) {}
```

### 2.5 Export Module

In `{source}/index.ts`:

```typescript
export * from "./{source}.client";
export * from "./{source}.schema";
```

---

## Phase 3: Integration Tests

Create `{source}.integration.test.ts`:

```typescript
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { NLLClient } from "./{source}.client";

describe("NLLClient", () => {
  describe("getTeams", () => {
    it("fetches teams for season", async () => {
      const program = Effect.gen(function* () {
        const client = yield* NLLClient;
        return yield* client.getTeams({ season: 2024 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(teams.length).toBeGreaterThan(0);
      expect(teams[0]).toHaveProperty("id");
      expect(teams[0]).toHaveProperty("name");
    });

    it("returns teams with expected properties", async () => {
      const program = Effect.gen(function* () {
        const client = yield* NLLClient;
        return yield* client.getTeams({ season: 2024 });
      });

      const teams = await Effect.runPromise(
        program.pipe(Effect.provide(NLLClient.Default)),
      );

      expect(teams[0]?.id).toBeTypeOf("string");
      expect(teams[0]?.name).toBeTypeOf("string");
    });
  });

  // Add tests for each endpoint...
});
```

Run tests:

```bash
infisical run --env=dev -- bun run test src/{source}/
```

---

## Phase 4: Extraction Scripts

### 4.1 Create Extraction Module

```
src/extract/{source}/
├── {source}.extractor.ts   # Main extraction logic
├── {source}.manifest.ts    # Track extraction progress
└── index.ts
```

### 4.2 Implement Extractor

In `{source}.extractor.ts`:

```typescript
import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { NLLClient } from "../../{source}/{source}.client";
import { ExtractConfigService } from "../extract.config";

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

const saveJson = <T>(filePath: string, data: T) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const dir = path.dirname(filePath);
    yield* fs.makeDirectory(dir, { recursive: true });
    yield* fs.writeFileString(filePath, JSON.stringify(data, null, 2));
  }).pipe(
    Effect.catchAll((e) =>
      Effect.fail(new Error(`Failed to write ${filePath}: ${String(e)}`)),
    ),
  );

export const extractAll = Effect.gen(function* () {
  const client = yield* NLLClient;
  const config = yield* ExtractConfigService;
  const path = yield* Path.Path;
  const outputDir = path.join(config.outputDir, "{source}");

  for (const year of YEARS) {
    yield* Effect.log(`Extracting ${year}...`);
    const yearDir = path.join(outputDir, String(year));

    // Teams
    const teams = yield* client.getTeams({ season: year });
    yield* saveJson(path.join(yearDir, "teams.json"), teams);
    yield* Effect.log(`  Teams: ${teams.length}`);

    // Players
    const players = yield* client.getPlayers({ season: year });
    yield* saveJson(path.join(yearDir, "players.json"), players);
    yield* Effect.log(`  Players: ${players.length}`);

    // Games
    const games = yield* client.getGames({ season: year });
    yield* saveJson(path.join(yearDir, "games.json"), games);
    yield* Effect.log(`  Games: ${games.length}`);
  }

  yield* Effect.log("Extraction complete!");
});
```

### 4.3 Create CLI Entry Point

In `src/extract/{source}/run.ts`:

```typescript
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { NLLClient } from "../../{source}/{source}.client";
import { ExtractConfigService } from "../extract.config";
import { extractAll } from "./{source}.extractor";

const MainLayer = Layer.mergeAll(
  NLLClient.Default,
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(extractAll.pipe(Effect.provide(MainLayer)));
```

Run extraction:

```bash
infisical run --env=dev -- bun src/extract/{source}/run.ts
```

### 4.4 Add Detail Endpoints (if needed)

For entities that have list vs detail endpoints:

```typescript
// After extracting list, get details
const playerDetails = [];

for (const player of players) {
  if (!player.slug) continue;
  
  const detail = yield* client.getPlayerDetail({ slug: player.slug }).pipe(
    Effect.catchAll(() => Effect.succeed(null)),
  );
  
  if (detail) {
    playerDetails.push({ player, detail });
  }
  
  // Rate limiting
  yield* Effect.sleep("200 millis");
}

yield* saveJson(path.join(outputDir, "player-details.json"), playerDetails);
```

---

## Phase 5: Validation

### 5.1 Create Validation Script

In `src/validate/validate-{source}.ts`:

```typescript
import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { ExtractConfigService } from "../extract/extract.config";
import {
  validateJsonArray,
  validateRequiredFields,
  validateUniqueField,
  crossReference,
  buildReport,
  printReport,
} from "./validate.service";
import type { FileValidationResult, CrossReferenceResult } from "./validate.schema";

const program = Effect.gen(function* () {
  const config = yield* ExtractConfigService;
  const path = yield* Path.Path;
  const sourceDir = path.join(config.outputDir, "{source}");
  const startTime = Date.now();

  yield* Effect.log(`\nValidating {source} data...`);

  const fileResults: FileValidationResult[] = [];
  const crossRefs: CrossReferenceResult[] = [];

  // Validate teams
  const { result: teamsResult, data: teams } = yield* validateJsonArray(
    path.join(sourceDir, "teams.json"),
    1,
  );
  
  if (teams.length > 0) {
    const requiredCheck = yield* validateRequiredFields(teams, ["id", "name"]);
    const uniqueCheck = yield* validateUniqueField(teams, "id");
    fileResults.push({
      ...teamsResult,
      checks: [...teamsResult.checks, requiredCheck, uniqueCheck],
    });
  }

  // Validate players
  const { result: playersResult, data: players } = yield* validateJsonArray(
    path.join(sourceDir, "players.json"),
    1,
  );
  
  if (players.length > 0) {
    const requiredCheck = yield* validateRequiredFields(players, ["playerId", "firstName", "lastName"]);
    const uniqueCheck = yield* validateUniqueField(players, "playerId");
    fileResults.push({
      ...playersResult,
      checks: [...playersResult.checks, requiredCheck, uniqueCheck],
    });

    // Cross-reference: player teams should exist in teams
    const xref = yield* crossReference(
      players.filter(p => p.teamId),
      teams,
      "teamId",
      "id",
      "players.json",
      "teams.json",
    );
    crossRefs.push(xref);
  }

  // Build and print report
  const report = buildReport("{source}", fileResults, crossRefs, startTime);
  yield* printReport(report);

  return report;
});

const MainLayer = Layer.mergeAll(
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
```

Run validation:

```bash
infisical run --env=dev -- bun src/validate/validate-{source}.ts
```

### 5.2 Add Data Anomaly Tests (optional)

Create `src/validate/{source}-anomaly.test.ts` for data-specific checks:

```typescript
import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { describe, beforeAll, it, expect, layer } from "@effect/vitest";
import { Effect } from "effect";

interface Team { id: string; name: string; }
interface Player { playerId: string; teamId?: string; }

let teams: Team[] = [];
let players: Player[] = [];

beforeAll(async () => {
  const loadData = Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const outputDir = path.join("data", "{source}");

    const teamsData = yield* fs.readFileString(path.join(outputDir, "teams.json")).pipe(
      Effect.catchAll(() => Effect.succeed("[]")),
    );
    const playersData = yield* fs.readFileString(path.join(outputDir, "players.json")).pipe(
      Effect.catchAll(() => Effect.succeed("[]")),
    );

    return {
      teams: JSON.parse(teamsData) as Team[],
      players: JSON.parse(playersData) as Player[],
    };
  });

  const data = await Effect.runPromise(loadData.pipe(Effect.provide(BunContext.layer)));
  teams = data.teams;
  players = data.players;
});

describe("{Source} Data Anomalies", () => {
  it("all players have valid team references", () => {
    const teamIds = new Set(teams.map(t => t.id));
    const invalidRefs = players.filter(p => p.teamId && !teamIds.has(p.teamId));
    expect(invalidRefs).toHaveLength(0);
  });

  it("no duplicate player IDs", () => {
    const ids = players.map(p => p.playerId);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toHaveLength(0);
  });
});
```

---

## Phase 6: Documentation & Cleanup

### 6.1 Update TODO.md

Add any remaining work items.

### 6.2 Update AGENTS.md

Add the new source to the commands and structure sections.

### 6.3 Add Environment Variables

Document required env vars in:
- `README.md`
- `AGENTS.md`
- Infisical (add the actual secrets)

### 6.4 Run Final Checks

```bash
# Type check
bun run typecheck

# Lint + format
bun run fix

# All tests
infisical run --env=dev -- bun run test

# Extraction
infisical run --env=dev -- bun src/extract/{source}/run.ts

# Validation
infisical run --env=dev -- bun src/validate/validate-{source}.ts
```

---

## Checklist

### Discovery
- [ ] Researched API/data availability
- [ ] Captured sample requests
- [ ] Created `{SOURCE}_DATA_MODEL.md`

### Client
- [ ] Created `src/{source}/` module
- [ ] Defined response schemas
- [ ] Defined request schemas
- [ ] Implemented client service
- [ ] Added integration tests

### Extraction
- [ ] Created `src/extract/{source}/` module
- [ ] Implemented extraction logic
- [ ] Tested extraction for one year
- [ ] Extracted all historical data

### Validation
- [ ] Created validation script
- [ ] Validated all extracted files
- [ ] Added data anomaly tests (optional)

### Cleanup
- [ ] Updated documentation
- [ ] Added env vars to Infisical
- [ ] All tests passing
- [ ] Lint clean

---

## Next Steps (Not Covered Here)

After extraction and validation are complete:

1. **Database Schema** - Design Drizzle tables in `@laxdb/core`
2. **Import Service** - Create sync service to populate database
3. **API Layer** - Add endpoints in `@laxdb/api`
4. **Web Routes** - Build UI in `@laxdb/web`
