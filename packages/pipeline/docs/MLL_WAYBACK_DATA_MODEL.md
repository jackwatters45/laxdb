# MLL Wayback Machine Data Model

**Purpose**: Document Wayback Machine CDX API findings for MLL schedule/game data (2000-2020).

**CDX API**: `https://web.archive.org/cdx/search/cdx?url=majorleaguelacrosse.com/{path}*&output=json`

**Note**: Complements StatsCrew data which lacks schedules/game results.

---

## Coverage Summary

### Schedule URL Captures by Year

| Year | Captures | Best Snapshot | URL Pattern |
|------|----------|---------------|-------------|
| 2000 | 6 | 20000916121948 | `/schedule.html` (static HTML) |
| 2001 | 1 | 20010309014837 | `/schedule.html` (static HTML) |
| 2005 | 15 | 20051126194211 | `/schedule/`, `/schedule/events?id={ID}` |
| 2006 | 45 | 20060701160324 | `/schedule/`, `/schedule/league/`, `/schedule?team={ID}` |
| 2021 | 2 | 20210214083228 | `/schedule.aspx?schedule=74` |

### Coverage Gaps

| Year Range | Status |
|------------|--------|
| 2000-2001 | Minimal (static pre-launch pages) |
| 2002-2004 | **NO CAPTURES** |
| 2005-2006 | Good coverage |
| 2007-2014 | **NO CAPTURES** |
| 2015-2020 | Minimal (redirects, errors) |
| 2021+ | Post-MLL (merged with PLL) |

**Critical Gap**: 2007-2019 schedules not available on Wayback Machine.

---

## URL Patterns

### Early Era (2000-2001)

| Pattern | Structure |
|---------|-----------|
| `/schedule.html` | Static HTML, simple table |

### PHP Era (2005-2006)

| Pattern | Structure | Notes |
|---------|-----------|-------|
| `/schedule/` | Main schedule page | Lists all games |
| `/schedule/league/` | League-wide schedule | Alternative view |
| `/schedule/?team={ID}` | Team-specific schedule | Team filter |
| `/schedule/events?id={ID}` | Individual event details | Game popup |

**Team IDs (2006)**:
| ID | Team |
|----|------|
| 614 | Baltimore Bayhawks |
| 615 | New Jersey Pride |
| 616 | Rochester Rattlers |
| 617 | Boston Cannons |
| 618 | Philadelphia Barrage |
| 619 | Long Island Lizards |
| 620 | Denver Outlaws |
| 623 | Chicago Machine |
| 624 | Los Angeles Riptide |
| 625 | San Francisco Dragons |

### ASPX Era (2019-2021)

| Pattern | Structure |
|---------|-----------|
| `/schedule.aspx?schedule={ID}` | Dynamic schedule page |
| `/standings.aspx?standings={ID}&path=mlax` | Standings page |
| `/stats.aspx?path=mlax&year={YEAR}` | Stats page |

---

## HTML Structure (2006 Era)

### Schedule Table

```html
<table>
  <tr height="35">
    <td>08/12/06</td>           <!-- Date: MM/DD/YY -->
    <td> 7:30 PM</td>           <!-- Time -->
    <td><img src="..."></td>    <!-- Away team logo -->
    <td><a href="/schedule/?team=617">Boston Cannons</a></td>  <!-- Away team -->
    <td>&nbsp;</td>             <!-- Score (if completed) -->
    <td><img src="..."></td>    <!-- Home team logo -->
    <td><a href="/schedule/?team=616">Rochester Rattlers</a></td>  <!-- Home team -->
    <td>&nbsp;</td>             <!-- Score (if completed) -->
    <td></td>                   <!-- Additional info -->
  </tr>
</table>
```

### Data Fields Available

| Field | Location | Format |
|-------|----------|--------|
| Date | td[0] | `MM/DD/YY` |
| Time | td[1] | `H:MM PM` |
| Away Team | td[3] > a | Team name, linked |
| Away Team ID | td[3] > a.href | `?team={ID}` |
| Away Score | td[4] | Integer (if played) |
| Home Team | td[6] > a | Team name, linked |
| Home Team ID | td[6] > a.href | `?team={ID}` |
| Home Score | td[7] | Integer (if played) |

---

## Best Snapshots for Extraction

### 2006 Season (Best Coverage)

| Date | Timestamp | URL | Content |
|------|-----------|-----|---------|
| Jul 1, 2006 | 20060701160324 | `/schedule/` | Full season schedule with results |
| Jul 1, 2006 | 20060701155850 | `/schedule/league/` | League-wide view |

### 2005 Season

| Date | Timestamp | URL | Content |
|------|-----------|-----|---------|
| Nov 26, 2005 | 20051126194211 | `/schedule/?` | Partial schedule data |

### 2021 Archive

| Date | Timestamp | URL | Content |
|------|-----------|-----|---------|
| Feb 14, 2021 | 20210214083228 | `/schedule.aspx?schedule=74` | Post-MLL schedule (reference only) |

---

## Extraction Strategy

### Available Data (2005-2006)

1. **Full Season Schedules**: Via `/schedule/` or `/schedule/league/`
2. **Team Schedules**: Via `/schedule/?team={ID}`
3. **Event Details**: Via `/schedule/events?id={ID}` (pop-up windows)

### Not Extractable (Critical Gaps)

| Years | Data | Reason |
|-------|------|--------|
| 2002-2004 | Schedules | No Wayback captures |
| 2007-2019 | Schedules | No Wayback captures |

### Alternative Sources for Missing Years

| Source | Years | Data Type |
|--------|-------|-----------|
| StatsCrew | 2001-2020 | Standings, stats (no schedules) |
| Sports Reference | Varies | May have game logs |
| Wikipedia | 2001-2020 | Season summaries, champions |
| ESPN Archives | Varies | Historical coverage |

---

## CDX API Usage

### Query Patterns

```bash
# All schedule captures
curl "https://web.archive.org/cdx/search/cdx?url=majorleaguelacrosse.com/schedule*&output=json&filter=statuscode:200"

# Specific year captures
curl "https://web.archive.org/cdx/search/cdx?url=majorleaguelacrosse.com/schedule*&output=json&from=2006&to=2006"

# Collapsed by timestamp (unique per year)
curl "https://web.archive.org/cdx/search/cdx?url=majorleaguelacrosse.com/schedule*&output=json&collapse=timestamp:4"
```

### CDX Response Format

```json
[
  ["urlkey", "timestamp", "original", "mimetype", "statuscode", "digest", "length"],
  ["com,majorleaguelacrosse)/schedule", "20060701160324", "http://majorleaguelacrosse.com:80/schedule/", "text/html", "200", "DIGEST", "7501"]
]
```

### Accessing Archived Pages

```
https://web.archive.org/web/{timestamp}/{original_url}
```

Example: `https://web.archive.org/web/20060701160324/http://majorleaguelacrosse.com:80/schedule/`

---

## Other Archived Content

### Stats Pages (Sparse Coverage)

| Year | Path | Status |
|------|------|--------|
| 2001 | `/stats/{team}.htm` | Basic team stats |
| 2004-2005 | `/stats/players/player_{ID}.html` | Player profiles |
| 2016+ | `/stats.aspx?path=mlax&year={YEAR}` | Modern format |

### Boxscores

One archived boxscore found:
- URL: `/stats/2001/boxscore_2001090301.html`
- Timestamp: 20040714081846
- Naming pattern suggests: `boxscore_{YYYYMMDD}{game_number}.html`

---

## Limitations

1. **No API**: Must scrape archived HTML pages
2. **Rate Limits**: Wayback Machine has usage limits
3. **Incomplete**: Major gaps in archive coverage
4. **Format Changes**: HTML structure varied across years
5. **Dynamic Content**: Some pages used JavaScript (may not render)

---

## Output Schema (Proposed)

```typescript
interface MLLScheduleGame {
  season: number;
  date: string;  // ISO date
  time?: string;
  awayTeamId: number;
  awayTeamName: string;
  awayScore?: number;
  homeTeamId: number;
  homeTeamName: string;
  homeScore?: number;
  isPlayoff: boolean;
  venue?: string;
  waybackTimestamp: string;  // Source tracking
}

interface MLLWaybackSource {
  timestamp: string;
  url: string;
  season: number;
  gamesExtracted: number;
}
```

---

## Recommendations

### Phase 1: Extract Available Data

1. Scrape 2005-2006 schedules from best snapshots
2. Document what's available vs. missing

### Phase 2: Fill Gaps

1. Check Sports Reference for historical box scores
2. Cross-reference with newspaper archives
3. Wikipedia season articles for championship games

### Phase 3: Data Quality

1. Validate team names match StatsCrew codes
2. Cross-check standings with StatsCrew
3. Flag uncertain/incomplete data

---

## Related Documents

- `MLL_STATSCREW_DATA_MODEL.md` - StatsCrew structure (no schedules)
- `EXTERNAL_LEAGUE_DATA_PLAN.md` - Overall MLL/WLA/MLA strategy

---

## CDX API Raw Data Reference

### Schedule Captures (status 200 only)

```
Year  Count  Sample URL
----  -----  ----------
2000  6      /schedule.html
2001  1      /schedule.html
2005  15     /schedule/, /schedule/events?id={ID}
2006  45     /schedule/, /schedule/league/, /schedule?team={ID}
2021  2      /schedule.aspx?schedule=74
```

### Stats Captures (sample)

```
Year  Path
----  ----
2001  /stats/barrage.htm, /stats/lizards.htm, /stats/cannons.htm
2004  /stats/players/player_{ID}.html
2016  /stats (200 response)
2018  /stats (200 response)
2020  /stats.aspx?path=mlax&year=2020
```
