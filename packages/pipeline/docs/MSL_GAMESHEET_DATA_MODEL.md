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

## Data Model

### Player Stats Response

Fields available in player stats tables:

- Player name
- Team
- GP (Games Played)
- G (Goals)
- A (Assists)
- PTS (Points)
- PIM (Penalty Minutes)
- PPG (Power Play Goals)
- SHG (Shorthanded Goals)

### Goalie Stats Response

- Goalie name
- Team
- GP (Games Played)
- W (Wins)
- L (Losses)
- GA (Goals Against)
- GAA (Goals Against Average)
- SV (Saves)
- SV% (Save Percentage)

### Standings Response

- Team name
- GP (Games Played)
- W (Wins)
- L (Losses)
- T (Ties)
- PTS (Points)

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

From Gamesheet season 6007:

| Team | Team ID |
|------|---------|
| Six Nations Chiefs | 222134 |
| Peterborough Lakers | 222133 |
| Brooklin L.C. | (TBD) |
| Brampton Excelsiors | 222135 |
| Oakville Rock | 222154 |
| Cobourg Kodiaks | 347550 |
| Owen Sound North Stars | (TBD) |

---

## Next Steps

1. Create MSL client for Gamesheet API
2. Implement Pointstreak scraper for historical data
3. Map team IDs across seasons
4. Cross-reference with official MSL website data
