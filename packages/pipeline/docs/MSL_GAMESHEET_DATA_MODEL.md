# MSL Gamesheet Data Model

**Purpose**: Document Gamesheet season IDs and data availability for Major Series Lacrosse (MSL).

**Platform**: https://gamesheetstats.com (powered by GameSheet Inc.)

**Parent Organization**: Ontario Lacrosse Association (OLA)

---

## Season ID Mapping

### Gamesheet Seasons (2023-present)

| Year | Season ID | League Name | URL Pattern |
|------|-----------|-------------|-------------|
| 2025 | 9567 | Major Series Lacrosse - 2025 | `/seasons/9567/*` |
| 2024 | 6007 | Major Series Lacrosse - 2024 Season | `/seasons/6007/*` |
| 2023 | 3246 | Major Series Lacrosse - 2023 Season | `/seasons/3246/*` |

### Related OLA Leagues on Gamesheet

| Year | Season ID | League Name |
|------|-----------|-------------|
| 2024 | 6002 | Ontario Series Lacrosse - OSL 2024 |

---

## Historical Data Sources

### Pointstreak (2009-2018)

MSL data prior to Gamesheet is available on Pointstreak:

**URL**: `https://stats.pointstreak.com/prostats/scoreboard.html?leagueid=832`

| Season | Year | Type |
|--------|------|------|
| Summer 2009 | 2009 | Regular Season |
| MSL Playoffs 09 | 2009 | Playoffs |
| Summer 2010 | 2010 | Regular Season |
| MSL Playoffs 10 | 2010 | Playoffs |
| Summer 2011 | 2011 | Regular Season |
| MSL Playoffs 2011 | 2011 | Playoffs |
| Summer 2012 | 2012 | Regular Season |
| MSL Playoffs 2012 | 2012 | Playoffs |
| Summer 2013 | 2013 | Regular Season |
| MSL Playoffs 2013 | 2013 | Playoffs |
| Summer 2014 | 2014 | Regular Season |
| MSL Playoffs 2014 | 2014 | Playoffs |
| Summer 2015 | 2015 | Regular Season |
| MSL Playoffs 2015 | 2015 | Playoffs |
| Summer 2016 | 2016 | Regular Season |
| MSL Playoffs 2016 | 2016 | Playoffs |
| Summer 2017 | 2017 | Regular Season |
| MSL Playoffs 2017 | 2017 | Playoffs |
| MSL Summer 2018 | 2018 | Regular Season |
| MSL Playoffs 2018 | 2018 | Playoffs |

---

## Coverage Gaps

| Year | Status | Notes |
|------|--------|-------|
| 2019 | Unknown | Season played (Jeff Teat ROY), platform TBD |
| 2020 | Cancelled | COVID-19 pandemic |
| 2021 | Exhibition only | MSL Classic at TRAC (no full season) |
| 2022 | Played | Mann Cup held; Gamesheet data not found |

---

## URL Patterns

### Gamesheet Base URL

`https://gamesheetstats.com/seasons/{seasonId}/{resource}`

### Resources

| Resource | Path | Description |
|----------|------|-------------|
| Players | `/players` | Player statistics |
| Goalies | `/goalies` | Goalie statistics |
| Standings | `/standings` | Team standings |
| Schedule | `/schedule` | Game schedule |
| Scores | `/scores` | Game results |
| Teams | `/teams/{teamId}` | Team page |
| Team Roster | `/teams/{teamId}/roster` | Team roster |

### Query Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `filter[type]` | `regular_season`, `playoff` | Game type filter |
| `filter[start_time_from]` | `2024-06-22` | Date filter |
| `configuration[primary-colour]` | `031E42` | UI customization |

---

## Page Structure Analysis

### Rendering Method

**Server-Side Rendered (SSR)** via Next.js with client-side hydration.

- `__NEXT_DATA__` script contains minimal metadata (season title, association)
- Actual statistics data loads via internal REST API after hydration
- `__N_SSP: true` indicates server-side props rendering

### HTML Table Structure

Tables use styled-components with these key CSS classes:

| Class | Purpose |
|-------|---------|
| `.gs-table` | Main table wrapper |
| `.fixed-cols` | Fixed rank column (24px width) |
| `.flexible-cols` | Scrollable stats columns |
| `.column-header` | Header cells (yellow #FEC307 background) |
| `.row-header` | Row identifier cells |
| `.cell` | Data cells |
| `.data` | Cell content wrapper |

### Navigation Structure

All season pages share consistent navigation:
- Scores → Schedule → Standings → Players → Goalies

### Pagination

- API-based pagination with `limit` and `offset` parameters
- Default page size: 20 records
- No infinite scroll; data loads in batches

---

## Internal REST API

### Base Pattern

```
https://gamesheetstats.com/api/{hook}/{method}/{seasonId}?filter[param]=value
```

### Discovered Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/useSeasonDivisions/getSeason/{id}` | GET | Season metadata |
| `/api/useSeasonDivisions/getDivisions/{id}` | GET | Division list |
| `/api/usePlayers/getPlayerStandings/{id}` | GET | Player statistics |
| `/api/useGoalies/getGoalieStandings/{id}` | GET | Goalie statistics |
| `/api/useStandings/getDivisionStandings/{id}` | GET | Team standings |
| `/api/useScoredGames/getSeasonScores/{id}` | GET | Game results |

### Common Query Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `filter[gametype]` | `overall`, `playoff`, `regular_season`, `exhibition` | Game type filter |
| `filter[sort]` | `-pts`, `gaa`, etc. | Sort field (prefix `-` for descending) |
| `filter[limit]` | integer | Records per page |
| `filter[offset]` | integer | Pagination offset |
| `filter[timeZoneOffset]` | integer | Client timezone offset in minutes |

---

## Data Model

### Player Stats API Response

Full field list from `/api/usePlayers/getPlayerStandings`:

| Field | Type | Description |
|-------|------|-------------|
| `names` | array | `{firstName, lastName, id, photo}` |
| `ids` | array | Player IDs |
| `teamNames` | object | `{title, id}` |
| `jersey` | array | Jersey numbers |
| `positions` | array | `"forward"` or `"defence"` |
| `rk` | array | Rankings |
| `gp` | array | Games played |
| `g` | array | Goals |
| `a` | array | Assists |
| `pts` | array | Total points |
| `pim` | array | Penalty minutes |
| `ppg` | array | Power play goals |
| `ppa` | array | Power play assists |
| `shg` | array | Shorthanded goals |
| `sha` | array | Shorthanded assists |
| `ht` | array | Hat tricks |
| `gwg` | array | Game-winning goals |
| `fg` | array | First goals |
| `otg` | array | Overtime goals |
| `eng` | array | Empty net goals |
| `uag` | array | Unassisted goals |
| `sog` | array | Shootout goals |
| `shots` | array | Total shots |
| `ptspg` | array | Points per game |
| `pimpg` | array | Penalties per game |
| `flags` | array | Special status (`"X"`, `"A"`, etc.) |

### Goalie Stats API Response

Full field list from `/api/useGoalies/getGoalieStandings`:

| Field | Type | Description |
|-------|------|-------------|
| `names` | object | `{firstName, lastName, id, photo}` |
| `teamNames` | object | `{title, id}` |
| `jersey` | array | Jersey numbers |
| `positions` | array | Always `"G"` |
| `rk` | array | Rankings |
| `gp` | array | Games played |
| `gs` | array | Games started |
| `sa` | array | Shots against |
| `ga` | array | Goals against |
| `gaa` | array | Goals against average |
| `svpct` | array | Save percentage |
| `wins` | array | Wins |
| `losses` | array | Losses |
| `ties` | array | Ties |
| `otl` | array | Overtime losses |
| `so` | array | Shutouts |
| `ice_time` | array | Ice time (seconds) |
| `g` | array | Goals scored |
| `a` | array | Assists |
| `pts` | array | Points |
| `ppga` | array | Power play goals against |
| `shga` | array | Shorthanded goals against |
| `flags` | array | Special status |

### Standings API Response

Full field list from `/api/useStandings/getDivisionStandings`:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Division name |
| `id` | number | Division ID |
| `ranks` | array | Team rankings |
| `teamTitles` | array | Team names |
| `teamLogos` | array | Logo URLs |
| `teamIds` | array | Team IDs |
| `gp` | array | Games played |
| `w` | array | Wins |
| `l` | array | Losses |
| `t` | array | Ties |
| `otw` | array | Overtime wins |
| `otl` | array | Overtime losses |
| `sow` | array | Shootout wins |
| `sol` | array | Shootout losses |
| `rw` | array | Regulation wins |
| `pts` | array | Points |
| `gf` | array | Goals for |
| `ga` | array | Goals against |
| `diff` | array | Goal differential |
| `ppg` | array | Power play goals |
| `shg` | array | Shorthanded goals |
| `ppga` | array | PP goals against |
| `shga` | array | SH goals against |
| `ppo` | array | Power play opportunities |
| `ppct` | array | Power play percentage |
| `pkp` | array | Penalty kill percentage |
| `pim` | array | Penalty minutes |
| `tsh` | array | Total shots |
| `stk` | array | Current streak |
| `p10` | array | Last 10 games record |

### Box Score Page Structure

Game detail pages at `/seasons/{seasonId}/games/{gameId}` include:

| Element | Data Attributes | Content |
|---------|-----------------|---------|
| Game info | `data-testid="game-number"` | Game title/series |
| Game type | `data-testid="game-type"` | `playoff`, `regular_season` |
| Date/time | `data-testid="game-date-time"` | Full timestamp |
| Location | `data-testid="game-location"` | Venue name |
| Status | `data-testid="game-status-text"` | `Final`, `In Progress` |
| Visitor | `data-testid="visitor-title"` | Team name |
| Home | `data-testid="home-title"` | Team name |
| Score | `data-testid="visitor-score"`, `data-testid="home-score"` | Final scores |
| SOG | `data-testid="visitor-sog"`, `data-testid="home-sog"` | Shots on goal |

Tabs available: Matchup, Lineups, Play-by-Play (sometimes disabled), Box Score

### Team Page Structure

Team pages at `/seasons/{seasonId}/teams/{teamId}` show:
- Team schedule with game links
- Columns: Date, Visitor, Home, Score, Location
- Links to individual box scores

---

## TypeScript Mapping

```typescript
// Year to Gamesheet Season ID mapping
export const MSL_GAMESHEET_SEASONS: Record<number, number> = {
  2025: 9567,
  2024: 6007,
  2023: 3246,
};

// Pointstreak league ID
export const MSL_POINTSTREAK_LEAGUE_ID = 832;

// Years available on each platform
export const MSL_GAMESHEET_YEARS = [2023, 2024, 2025] as const;
export const MSL_POINTSTREAK_YEARS = [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018] as const;
```

---

## MSL Teams (2024)

From Gamesheet season 6007 (verified from standings API):

| Team | Team ID |
|------|---------|
| Six Nations Chiefs | 222134 |
| Peterborough Lakers | 222133 |
| Brooklin L.C. | 222131 |
| Brampton Excelsiors | 222135 |
| Oakville Rock | 222154 |
| Cobourg Kodiaks | 222132 |
| Owen Sound North Stars | 222153 |

---

## Next Steps

1. Create MSL client for Gamesheet API
2. Implement Pointstreak scraper for historical data
3. Map team IDs across seasons
4. Cross-reference with official MSL website data
