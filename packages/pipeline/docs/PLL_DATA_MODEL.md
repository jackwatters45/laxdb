# PLL Data Model

**Purpose**: Map all PLL API entities, their relationships, and data availability before designing the database schema.

---

## API Endpoints Overview

| Endpoint | Type | Returns | Extracted? |
|----------|------|---------|------------|
| `getTeams(year)` | GraphQL | Team[] with stats, coaches | Yes |
| `getPlayers(season)` | GraphQL | Player[] with stats, allTeams | Yes |
| `getEvents(year)` | REST | Event[] (games) with teams, scores | Yes |
| `getStandings(year)` | REST | Standing[] with win/loss records | Yes |
| `getStandingsGraphQL(year)` | GraphQL | Standing[] with embedded team | Yes |
| `getPlayerDetail(slug)` | GraphQL | careerStats, allSeasonStats, accolades | Yes (502 players) |
| `getTeamDetail(id, year)` | GraphQL | events, coach details, allYears | Yes (53 team-years) |
| `getEventDetail(slug)` | GraphQL | playLogs (play-by-play) | Yes (269 events, 58K plays) |
| `getAdvancedPlayers(year)` | GraphQL | Rate stats, shooting hand breakdowns | Yes (all years) |
| `getStatLeaders(year, stats)` | GraphQL | Leaderboards by stat | Yes (7 years × 9 categories) |
| `getCareerStats(stat)` | GraphQL | Career leaderboards | No (covered by player details) |

---

## Core Entities

### 1. Team

**Primary Key**: `officialId` (3-letter code, e.g., "ARC", "ATL", "CAN")

**From getTeams (list):**
```typescript
{
  officialId: "ARC",           // Primary key
  locationCode: "UTA",         // City abbreviation
  location: "Utah",            // City name
  fullName: "Archers",         // Team name
  urlLogo: "https://...",
  slogan: "The Peak of Excellence",
  league: "PLL",
  
  // Season record
  teamWins: 6,
  teamLosses: 4,
  teamTies: 0,
  teamWinsPost: 0,
  teamLossesPost: 0,
  teamTiesPost: 0,
  
  // Embedded
  coaches: [{ name, coachType }],  // Only name + type
  stats: PLLTeamStats,             // Regular season stats
  postStats: PLLTeamStats,         // Playoff stats
  champSeries: {                   // Championship Series
    teamWins, teamLosses, teamTies,
    stats: PLLTeamStats
  }
}
```

**From getTeamDetail (detail) - additional fields:**
```typescript
{
  allYears: [2019, 2020, ...],     // Years team existed
  coaches: [{                       // More detail
    officialId, coachType, firstName, lastName
  }],
  events: [{                        // Team's games
    id, slugname, startTime, venue, ...
  }]
}
```

**Key insights:**
- Teams are stable across years (same officialId)
- Location/locationCode can change (e.g., team relocation)
- Stats are per-year, per-segment (regular/post/champSeries)

---

### 2. Player

**Primary Key**: `officialId` (6-digit string, e.g., "000365")

**From getPlayers (list):**
```typescript
{
  officialId: "000365",        // Primary key
  firstName: "Jack",
  lastName: "Rowlett",
  lastNameSuffix: "",          // Jr., III, etc.
  slug: "jack-rowlett",        // URL slug
  
  // Profile
  jerseyNum: 99,               // Current jersey
  profileUrl: "https://...",
  handedness: "R",
  country: "United States",
  countryCode: "USA",
  collegeYear: 2019,           // College graduation year
  experience: 8,               // Years in league
  expFromYear: 2019,           // First year
  isCaptain: false,
  
  // Injury
  injuryStatus: "H",           // H = healthy
  injuryDescription: "",
  
  // Historical data
  allYears: [2019, 2020, ...], // Years played
  allTeams: [                  // ROSTER HISTORY
    {
      officialId: "CHA",       // Team ID
      year: 2024,
      position: "D",
      positionName: "Defense",
      jerseyNum: 99,
      location: "Carolina",
      fullName: "Chaos",
      ...
    },
    // ... one entry per team per year
  ],
  
  // Current year stats
  stats: PLLPlayerStats,       // Regular season
  postStats: PLLPlayerStats,   // Playoffs
  champSeries: {               // Championship Series
    position, positionName,
    team: { officialId, ... },
    stats: PLLPlayerStats
  }
}
```

**From getPlayerDetail (detail) - additional fields:**
```typescript
{
  careerStats: PLLPlayerCareerStats,  // Lifetime totals
  allSeasonStats: [                   // Per-year breakdown
    { year, seasonSegment, teamId, gamesPlayed, goals, ... }
  ],
  accolades: [                        // Awards
    { awardName: "All-Star", years: [2022, 2023] }
  ],
  advancedSeasonStats: {              // Advanced metrics
    unassistedGoals, settledGoals, fastbreakGoals, ...
  }
}
```

**Key insights:**
- `allTeams[]` is THE roster data - contains player-team-year-position relationships
- Players can be on multiple teams across years (trades)
- Stats are per-year, per-segment (regular/post/champSeries)
- Position can change year-to-year (in allTeams)

---

### 3. Event (Game)

**Primary Keys**: 
- `id` (numeric, internal)
- `slugname` (URL slug, e.g., "championship-series-1-2024-2-14")
- `eventId` (string, e.g., "2024_cs_ev1")

**From getEvents (list):**
```typescript
{
  id: 234,                              // Numeric ID
  slugname: "championship-series-...",  // URL slug
  eventId: "2024_cs_ev1",               // Event identifier
  externalId: "283798658",              // External system ID
  
  // Time & Location
  year: 2024,
  startTime: "1707949800",              // Unix timestamp (string!)
  week: "0",                            // Week number
  gameNumber: 1,
  venue: "The St. James",
  location: "Springfield, VA",
  venueLocation: null,
  
  // Classification
  league: "PLL",
  seasonSegment: "champseries",         // regular, post, champseries
  description: "Round Robin - Gm 1",
  
  // Status
  eventStatus: 3,                       // Game status code
  period: 5,                            // Current/final period
  gameStatus: null,
  
  // Teams & Scores
  homeTeam: PLLEventTeam,               // Full team object
  awayTeam: PLLEventTeam,
  homeScore: 25,
  visitorScore: 26,
  
  // Media
  broadcaster: ["ESPN2", "ESPN+"],
  urlStreaming: "https://...",
  urlTicket: "...",
  
  // Other
  waitlist: false,
  snl: false                            // Saturday Night Lacrosse
}
```

**From getEventDetail (detail) - additional fields:**
```typescript
{
  playLogs: [                           // Play-by-play
    {
      id: 1,
      period: 1,
      minutes: 12,
      seconds: 0,
      teamId: "ATL",
      gbPlayerName: "Jeff Teat",
      description: "Goal scored..."
    },
    // ... many entries per game
  ]
}
```

**Key insights:**
- Events contain FULL team objects (duplicated data)
- `startTime` is Unix timestamp as string
- `seasonSegment` distinguishes game type: "regular", "post", "champseries"
- Play-by-play only available via detail endpoint

---

### 4. Standing

**From getStandings (REST):**
```typescript
{
  teamId: "ATL",              // Team reference
  fullName: "Atlas",
  location: "New York",
  locationCode: "NYA",
  urlLogo: "https://...",
  
  // Record
  seed: null,                 // Playoff seed
  wins: 7,
  losses: 3,
  ties: 0,
  scores: 151,                // Points scored
  scoresAgainst: 124,
  scoreDiff: 27,
  
  // Conference
  conference: "eastern",
  conferenceSeed: null,
  conferenceWins: 0,
  conferenceLosses: 0,
  conferenceTies: 0,
  conferenceScores: 0,
  conferenceScoresAgainst: 0
}
```

**From getStandingsGraphQL - same data but with nested team object**

**Key insights:**
- Standings are per-year snapshots
- Can request regular OR champSeries standings
- Essentially duplicate of team record data

---

### 5. Coach

**From getTeams (embedded in Team):**
```typescript
{
  name: "Chris Bates",
  coachType: "head"           // head, assistant
}
```

**From getTeamDetail (more detail):**
```typescript
{
  officialId: "...",          // Coach ID
  coachType: "head",
  firstName: "Chris",
  lastName: "Bates"
}
```

**Key insights:**
- Coaches only available embedded in Team
- List endpoint has less detail than detail endpoint
- Would need team detail to get coach IDs

---

## Entity Relationships

```
┌─────────────┐
│   League    │  (PLL - hardcoded for now)
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐      ┌─────────────┐
│   Season    │──────│  Standing   │  (year snapshot)
│   (year)    │ 1:N  └──────┬──────┘
└──────┬──────┘             │ N:1
       │                    ▼
       │ 1:N         ┌─────────────┐
       ├────────────▶│    Team     │◀──────────────┐
       │             └──────┬──────┘               │
       │                    │ 1:N                  │
       │                    ▼                      │
       │             ┌─────────────┐               │
       │             │   Coach     │               │
       │             └─────────────┘               │
       │                                           │
       │ 1:N                                       │
       ├─────────────────────────────────────┐     │
       ▼                                     │     │
┌─────────────┐                              │     │
│   Player    │                              │     │
└──────┬──────┘                              │     │
       │                                     │     │
       │ 1:N (via allTeams)                  │     │
       ▼                                     │     │
┌─────────────────────┐                      │     │
│   Roster Entry      │──────────────────────┘     │
│ (player+team+year)  │                            │
│   position, jersey  │                            │
└─────────────────────┘                            │
                                                   │
       ┌───────────────────────────────────────────┘
       │ (home/away)
       ▼
┌─────────────┐
│   Event     │  (Game)
│   (Game)    │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐
│  Play Log   │  (play-by-play, detail only)
└─────────────┘
```

---

## Stats Breakdown

Stats exist at multiple levels:

### Player Stats (PLLPlayerStats) - per player per season segment
- Goals, assists, points
- Shots, shot %, shots on goal
- Two-point shots/goals
- Ground balls, turnovers, caused turnovers
- Faceoffs (won, lost, %)
- Saves, save %, goals against, GAA
- Penalties (count, PIM)
- Power play / short handed stats
- Advanced: touches, passes, rates

### Team Stats (PLLTeamStats) - per team per season segment
- Scores, scores against, goals
- Shots, shot %, shots on goal
- Two-point stats
- Ground balls, turnovers, caused turnovers
- Faceoffs (won, lost, %)
- Clears, clear %
- Rides, ride %
- Saves, save %, goals against
- Penalties, PIM
- Power play / man down stats

### Career Stats (PLLPlayerCareerStats) - lifetime
- Aggregated totals across all seasons

### Season Stats (PLLPlayerSeasonStats) - per year per segment
- Available in player detail only
- Shows year + seasonSegment + teamId + stats

---

## Data Gaps & Decisions Needed

### 1. Play-by-play (Event Details)
- **Cost**: ~300 API calls (50-60 events × 7 years)
- **Value**: Enables game flow analysis, play-level stats
- **Decision**: Defer until core data is stable

### 2. Player Career Stats & Accolades
- **Cost**: ~1400 API calls (200 players × 7 years, but one call per player)
- **Value**: Enables career leaderboards, awards display
- **Decision**: Extract after core sync is working

### 3. Coach Details
- **Cost**: ~56 API calls (8 teams × 7 years)
- **Value**: Coach IDs, proper name parsing
- **Decision**: Can extract via team details

### 4. Advanced Stats
- **Cost**: ~7 API calls (one per year)
- **Value**: Rate-based stats, shooting hand analysis
- **Decision**: Extract alongside players

---

## Extraction Strategy

### Phase 1: Core Data (DONE)
- [x] Teams per year (list)
- [x] Players per year (list)
- [x] Events per year (list)
- [x] Standings per year

### Phase 2: Enhanced Data (DONE)
- [x] Advanced players per year (rate stats) - extracted for all years
- [x] Player details sample - analyzed data structure
- [x] Player details (full extraction) - 502 unique players, accolades + career stats
- [x] Team details per year (coach IDs, events) - 53 team-year combos

### Phase 3: Detail Data (DONE)
- [x] Event details (play-by-play) - 269 events, 58,652 total plays
- [x] Stat leaders per year - 7 years × 9 stat categories

---

## Sample Analysis Results

### Player Detail Endpoint - Value Assessment

Sampled 5 top players (Jeff Teat, Tre Leclaire, Zed Williams, Connor Fields, Marcus Holman).

| Field | Unique to Detail? | Value |
|-------|-------------------|-------|
| `careerStats` | YES | Lifetime totals (25 fields) |
| `allSeasonStats` | YES (historical) | Stats per year/segment (current year in list) |
| `accolades` | YES | Awards (All-Star, MVP, ROY, etc.) |
| `advancedSeasonStats` | NO (same as getAdvancedPlayers) | Rate stats, shooting breakdowns |

### Accolade Examples (Jeff Teat)
```json
[
  { "awardName": "All-Star", "years": [2021, 2022, 2023, 2024, 2025] },
  { "awardName": "ROY", "years": [2021] },
  { "awardName": "1st Team All-Pro", "years": [2021, 2024] },
  { "awardName": "2nd Team All-Pro", "years": [2022, 2023, 2025] },
  { "awardName": "MVP", "years": [2024] },
  { "awardName": "AOY", "years": [2024] }
]
```

### Full Player Detail Extraction (COMPLETED)

Extracted player details for ALL 502 unique players across all years.

**Results:**
- 502 players extracted, 0 failures
- 290 players have accolades (awards)
- Duration: ~3.5 minutes (502 API calls)
- Output: `output/pll/player-details.json` (3.4MB)

**Award counts extracted:**
| Award | Count |
|-------|-------|
| All-Star | 561 |
| Champion | 275 |
| 1st Team All-Pro | 89 |
| 2nd Team All-Pro | 67 |
| Championship Series Champion | 36 |
| DPOY | 21 |
| MVP | 16 |
| GOY | 16 |
| ROY | 16 |
| OPOY | 9 |

---

## ID Reference

| Entity | Primary ID | Other IDs |
|--------|-----------|-----------|
| Team | `officialId` (e.g., "ARC") | `team_id` in some contexts |
| Player | `officialId` (e.g., "000365") | `slug` for URLs |
| Event | `id` (numeric) | `slugname`, `eventId`, `externalId` |
| Coach | `officialId` | Only in team detail |
| Standing | None (team + year combo) | Uses `teamId` reference |

---

## Team Reference

### All-Time Teams

| officialId | location | fullName | Years Active | Notes |
|------------|----------|----------|--------------|-------|
| ARC | Utah | Archers | 2019-present | |
| ATL | New York | Atlas | 2019-present | |
| CAN | Boston | Cannons | 2021-present | MLL merger |
| CHA | Carolina | Chaos | 2019-present | |
| CHR | - | Chrome | 2019-2023 | Became Outlaws |
| OUT | Denver | Outlaws | 2024-present | Rebranded from Chrome |
| RED | California | Redwoods | 2019-present | |
| WAT | Philadelphia | Waterdogs | 2020-present | |
| WHP | Maryland | Whipsnakes | 2019-present | |

### Team Count by Year

| Year | Teams | Changes |
|------|-------|---------|
| 2019 | 6 | ARC, ATL, CHA, CHR, RED, WHP (founding) |
| 2020 | 7 | + WAT (Waterdogs added) |
| 2021 | 8 | + CAN (Cannons, from MLL merger) |
| 2022 | 8 | |
| 2023 | 8 | |
| 2024 | 8 | CHR → OUT (Chrome rebranded to Outlaws) |
| 2025 | 8 | |

### Notes
- Location data (`location`, `locationCode`) only populated from 2024 onwards in list endpoints
- CHR and OUT are the same franchise - Chrome rebranded to Outlaws for 2024 season
- Players who were on Chrome in 2023 may show as being on a different team in 2024 (Outlaws or traded)

---

## Enumerated Values

### Positions
| Code | Name | Description |
|------|------|-------------|
| A | Attack | Offensive player |
| M | Midfield | Two-way player |
| D | Defense | Defensive player |
| G | Goalie | Goalkeeper |
| FO | Faceoff | Faceoff specialist |
| LSM | Long Stick Middie | Defensive midfielder with long stick |
| SSDM | Short Stick Defensive Middie | Defensive midfielder with short stick |

### Season Segments
| Value | Description |
|-------|-------------|
| `regular` | Regular season games |
| `post` | Playoff games |
| `champseries` | Championship Series (round-robin tournament) |
| `allstar` | All-Star game |

### Handedness
| Value | Description |
|-------|-------------|
| `R` | Right-handed |
| `L` | Left-handed |
| `R/L` | Primarily right, can play left |
| `L/R` | Primarily left, can play right |

### Event Status
| Value | Meaning (inferred) |
|-------|---------------------|
| 1 | Scheduled |
| 2 | In Progress |
| 3 | Final/Completed |

### Coach Types
| Value | Description |
|-------|-------------|
| `head` | Head coach |
| `assistant` | Assistant coach |

### Injury Status
| Value | Meaning (inferred) |
|-------|---------------------|
| `H` | Healthy |
| `Q` | Questionable |
| `O` | Out |
| `IR` | Injured Reserve |

---

## Complete Extraction Summary

**Last Updated**: 2026-01-02

All PLL data has been extracted and is ready for database design.

### Output Files

| File | Size | Contents |
|------|------|----------|
| `output/pll/{year}/teams.json` | ~100KB ea | 8 teams per year with stats |
| `output/pll/{year}/players.json` | ~2MB ea | All players with season stats |
| `output/pll/{year}/advanced-players.json` | ~2MB ea | Advanced rate stats |
| `output/pll/{year}/events.json` | ~200KB ea | All games per year |
| `output/pll/{year}/standings.json` | ~10KB ea | Season standings |
| `output/pll/player-details.json` | 3.4MB | 502 players - career stats + accolades |
| `output/pll/team-details.json` | 580KB | 53 team-years - coaches, events |
| `output/pll/event-details.json` | 14MB | 269 events - play-by-play logs |
| `output/pll/stat-leaders.json` | 364KB | 7 years × 9 stat categories |

### Data Totals

| Entity | Count | Years |
|--------|-------|-------|
| Teams | 8 per year | 2019-2025 |
| Players | 502 unique | All-time |
| Events/Games | 269 | 2021-2025 (play-by-play) |
| Play-by-Play Logs | 58,652 | 2021-2025 |
| Coach Records | 159 | All years |
| Player Accolades | 290 players | All-time |

### Next Steps

1. Design database schema based on extracted data
2. Build sync service to import data
3. Create deduplication logic for player matching
