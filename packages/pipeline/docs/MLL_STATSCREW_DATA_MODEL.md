# MLL StatsCrew Data Model

**Purpose**: Document StatsCrew's MLL historical data structure for scraping (2001-2020).

**Source**: https://www.statscrew.com/lacrosse/l-MLL

**Note**: StatsCrew does NOT have schedules/game results. Use Wayback Machine for schedule data.

---

## Data Availability

| Year Range | Data Available |
|------------|----------------|
| 2001-2020 | Standings, Leaders, Rosters, Team Stats |

---

## URL Patterns

### League Pages

| Page | URL Pattern | Example |
|------|------------|---------|
| League Home | `/lacrosse/l-MLL` | [Link](https://www.statscrew.com/lacrosse/l-MLL) |
| Season Home | `/lacrosse/l-MLL/y-{YEAR}` | `/lacrosse/l-MLL/y-2019` |
| Standings | `/lacrosse/standings/l-MLL/y-{YEAR}` | `/lacrosse/standings/l-MLL/y-2019` |
| Leaders | `/lacrosse/leaders/l-MLL/y-{YEAR}` | `/lacrosse/leaders/l-MLL/y-2019` |

### Team Pages

| Page | URL Pattern | Example |
|------|------------|---------|
| Team Stats | `/lacrosse/stats/t-{TEAM_CODE}/y-{YEAR}` | `/lacrosse/stats/t-MLLCHB/y-2019` |
| Team Roster | `/lacrosse/roster/t-{TEAM_CODE}/y-{YEAR}` | `/lacrosse/roster/t-MLLCHB/y-2019` |

### Player Pages

| Page | URL Pattern | Example |
|------|------------|---------|
| Player Stats | `/lacrosse/stats/p-{PLAYER_ID}` | `/lacrosse/stats/p-thomplyl001` |

---

## Team Codes (2019 Season)

| Code | Team Name |
|------|-----------|
| MLLATL | Atlanta Blaze |
| MLLBOC | Boston Cannons |
| MLLCHB | Chesapeake Bayhawks |
| MLLDAL | Dallas Rattlers |
| MLLDEO | Denver Outlaws |
| MLLNYL | New York Lizards |

**Note**: Team codes follow pattern `MLL{3-letter abbreviation}`. Teams varied across years (expansion, contraction, relocation).

---

## Core Entities

### 1. Standing

**Source**: `/lacrosse/standings/l-MLL/y-{YEAR}`

**Table Columns**:
| Column | Description |
|--------|-------------|
| Team | Team name (linked) |
| W | Wins |
| L | Losses |
| GF | Goals For |
| GA | Goals Against |
| (Playoff Result) | Championship/playoff outcome |

**Example Data (2019)**:
- Chesapeake Bayhawks: 9-5, Won Championship
- Denver Outlaws: 8-6, Lost in Playoffs
- Boston Cannons: 7-7
- Atlanta Blaze: 6-8
- Dallas Rattlers: 6-8
- New York Lizards: 4-10

---

### 2. League Leaders

**Source**: `/lacrosse/leaders/l-MLL/y-{YEAR}`

**Statistical Categories Available**:
| Category | Columns |
|----------|---------|
| Points | Player, Team, Pts, G, A |
| Goals | Player, Team, G, (supporting stats) |
| Assists | Player, Team, A, (supporting stats) |

**Notes**:
- Top 10 players shown per category
- Player names link to individual stat pages
- Team names link to team stat pages

---

### 3. Roster

**Source**: `/lacrosse/roster/t-{TEAM_CODE}/y-{YEAR}`

**Table Columns**:
| Column | Description |
|--------|-------------|
| Player | Player name (linked to stats) |
| Pos. | Position code |
| Birth Date | Date of birth (when available) |
| Height | Player height |
| Weight | Player weight |
| Hometown | Geographic origin |

**Position Codes**:
| Code | Position |
|------|----------|
| A | Attack |
| M | Midfield |
| D | Defense |
| G | Goalie |
| F | Faceoff Specialist |
| T | Transition |
| FO | Faceoff |

---

### 4. Team Stats

**Source**: `/lacrosse/stats/t-{TEAM_CODE}/y-{YEAR}`

**Tables Present**:
1. Scoring (Regular Season)
2. Goalkeepers (Regular Season)
3. Postseason - Scoring
4. Postseason - Goalkeepers

**Scoring Table Columns**:
| Column | Description |
|--------|-------------|
| Player | Player name (linked) |
| Pos | Position |
| GP | Games Played |
| G | Goals |
| 2PG | 2-Point Goals |
| A | Assists |
| Pts | Points |
| Pen | Penalties |
| PPG | Power Play Goals |
| SHG | Shorthanded Goals |
| GWG | Game Winning Goals |
| Sh | Shots |
| SOG | Shots on Goal |
| Sh% | Shot Percentage |
| S% | Scoring Goals Percentage |
| GB | Ground Balls |
| TOC | Time on Crease |
| CTO | Crease Time Outs |
| FO | Face Offs |
| FOW | Face Off Wins |
| FO% | Face Off Percentage |

**Goalkeeper Table Columns**:
| Column | Description |
|--------|-------------|
| Player | Player name (linked) |
| GP | Games Played |
| Min | Minutes |
| W | Wins |
| L | Losses |
| GA | Goals Against |
| 2GA | 2-Point Goals Against |
| GAA | Goals Against Average |
| Sh | Shots Faced |
| Sv | Saves |
| Sv% | Save Percentage |

---

### 5. Player

**Source**: `/lacrosse/stats/p-{PLAYER_ID}`

**Player ID Format**: `{lastname}{firstname}{number}`
- Example: `thomplyl001` (Lyle Thompson)
- Lowercase last name + first name + numeric identifier

**Available Data** (from roster page):
- Full name
- Position
- Birth date (when available)
- Height
- Weight
- Hometown

---

## Data NOT Available on StatsCrew

| Data Type | Alternative Source |
|-----------|-------------------|
| Game Schedules | Wayback Machine (majorleaguelacrosse.com) |
| Game Results | Wayback Machine |
| Play-by-Play | Not available |
| Advanced Stats | Not available |
| Player Photos | Not available |

---

## Extraction Strategy

### Phase 1: Scrape Core Data

1. **Standings by Year** (2001-2020)
   - URL: `/lacrosse/standings/l-MLL/y-{YEAR}`
   - Extract: Team, W, L, GF, GA
   - Discover team codes per year

2. **Leaders by Year** (2001-2020)
   - URL: `/lacrosse/leaders/l-MLL/y-{YEAR}`
   - Extract: Points, Goals, Assists leaders

3. **Rosters by Team-Year**
   - URL: `/lacrosse/roster/t-{TEAM_CODE}/y-{YEAR}`
   - Extract: Player, Position, Bio info
   - Build player ID list

4. **Team Stats by Team-Year**
   - URL: `/lacrosse/stats/t-{TEAM_CODE}/y-{YEAR}`
   - Extract: Full scoring and goalie stats

### Phase 2: Player Details (Optional)

- Scrape individual player pages for career data
- Lower priority - can be derived from team stats

---

## Rate Limiting Considerations

- StatsCrew is a small site, be respectful
- Recommend: 1-2 requests per second max
- Cache responses locally
- Run extraction during off-peak hours

---

## HTML Parsing Notes

Tables use standard HTML `<table>` structure:
- `<th>` for headers
- `<td>` for data cells
- Links in team/player names contain IDs in href

Example selectors (conceptual):
```
standings table: table containing "Team", "W", "L" headers
roster table: table containing "Player", "Pos.", "Birth Date" headers
stats table: table containing "GP", "G", "A" headers
```

---

## Cross-Reference with PLL Data

The PLL API already contains career stats for 801 MLL-era players via `getCareerStats`. StatsCrew data can:

1. **Validate** PLL API MLL career stats
2. **Augment** with season-by-season breakdown
3. **Add** roster/bio data not in PLL API
4. **Fill gaps** for players missing from PLL API

### Bridge Players

Players who played in both MLL (pre-2020) and PLL (2019+):
- Will appear in both StatsCrew and PLL datasets
- Match by name/slug for deduplication
- Merge MLL season stats with PLL profile

---

## Output Schema (Proposed)

```typescript
// Standings
interface MLLStanding {
  year: number;
  teamCode: string;
  teamName: string;
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  playoffResult?: string;
}

// Leader Entry
interface MLLLeader {
  year: number;
  category: 'points' | 'goals' | 'assists';
  rank: number;
  playerName: string;
  playerId: string;
  teamCode: string;
  statValue: number;
}

// Roster Entry
interface MLLRosterEntry {
  year: number;
  teamCode: string;
  playerName: string;
  playerId: string;
  position: string;
  birthDate?: string;
  height?: string;
  weight?: string;
  hometown?: string;
}

// Player Season Stats
interface MLLPlayerSeasonStats {
  year: number;
  teamCode: string;
  playerId: string;
  playerName: string;
  position: string;
  gamesPlayed: number;
  goals: number;
  twoPointGoals: number;
  assists: number;
  points: number;
  penalties: number;
  powerPlayGoals: number;
  shorthandedGoals: number;
  gameWinningGoals: number;
  shots: number;
  shotsOnGoal: number;
  shotPct: number;
  groundBalls: number;
  faceoffs: number;
  faceoffWins: number;
  faceoffPct: number;
}

// Goalie Season Stats
interface MLLGoalieSeasonStats {
  year: number;
  teamCode: string;
  playerId: string;
  playerName: string;
  gamesPlayed: number;
  minutes: number;
  wins: number;
  losses: number;
  goalsAgainst: number;
  twoPointGoalsAgainst: number;
  gaa: number;
  shotsFaced: number;
  saves: number;
  savePct: number;
}
```

---

## Next Steps

After this discovery phase:

1. **mll-discovery-002**: Analyze Wayback Machine for schedule/game data
2. **mll-client-001**: Build StatsCrew scraper client
3. **mll-extract-001**: Extract standings and leaders
4. **mll-extract-002**: Extract rosters and team stats
