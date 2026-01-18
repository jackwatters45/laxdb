# MSL Official Website Data Model

**Purpose**: Document majorserieslacrosse.ca structure and data availability.

**Source**: https://www.majorserieslacrosse.ca/

**Platform**: LacrosseShift / DigitalShift (custom CMS with embedded stats portal)

---

## Site Overview

The official MSL website uses two distinct systems:
1. **Main CMS** - WordPress/custom for content (teams, news, history)
2. **DigitalShift Stats Portal** - Embedded iframe for live stats/standings

---

## API Configuration (DigitalShift)

| Setting | Value |
|---------|-------|
| Web API | `https://web.api.digitalshift.ca` |
| Stats API | `https://stats.api.digitalshift.ca` |
| Live WebSocket | `wss://live.digitalshift.ca` |
| Client Service ID | `23d8705b-6171-4586-88bc-ecfb2c6ea0b3` |
| League ID | 252 |
| Current Season ID | 4260 |

**Note**: APIs require authentication. Data accessed via embedded iframes only.

---

## URL Patterns

### Main Site Pages

| Page | Path | Status |
|------|------|--------|
| Home | `/` | ✅ Active |
| Teams | `/teams` | ✅ Active |
| History | `/history` | ✅ Active |
| News | `/news` | ✅ (empty) |
| Schedule | `/schedule` | Redirects to GameSheet |
| Statistics | External | GameSheet links |

### Stats Portal (Embedded)

| Section | URL Fragment | Description |
|---------|--------------|-------------|
| Standings | `#/252/standings?season_id=4260` | Team rankings |
| Scores | `#/252/scores?season_id=4260` | Game results |
| Brackets | `#/252/brackets?season_id=4260` | Playoff tree |
| Players | `#/252/players?season_id=4260` | Player stats |
| Leaders | `#/252/leaders?season_id=4260` | Stat leaders |
| Stars | `#/252/stars?season_id=4260` | Game stars |
| Transactions | `#/252/transactions?season_id=4260` | Player moves |
| Suspensions | `#/252/suspensions?season_id=4260` | Disciplinary |
| Attendance | `#/252/attendance?season_id=4260` | Game attendance |

---

## Teams (2024-2025)

| Team | Arena | Location | Website |
|------|-------|----------|---------|
| Brampton Excelsiors | Brampton Memorial Arena | 69 Elliott St, Brampton, ON | bramptonexcelsiors.ca |
| Brooklin Lacrosse Club | Iroquois Park Sports Centre | 500 Victoria St W, Whitby, ON | brooklinLC.com |
| Cobourg Kodiaks | Cobourg Community Centre | 750 D'Arcy Street, Cobourg, ON | cobourgkodiaks.ca |
| Oakville Rock | Toronto Rock Athletic Centre | 1132 Invicta Drive, Oakville, ON | oakvillerock.com |
| Owen Sound North Stars | Harry Lumley Bayshore | 1900 3rd Ave E, Owen Sound, ON | N/A |
| Peterborough Lakers | Peterborough Memorial Centre | 151 Lansdowne St, Peterborough, ON | peterboroughlakers.ca |
| Six Nations Chiefs | Iroquois Lacrosse Arena | 3201 Second Line, Hagersville, ON | sixnationschiefs.blogspot.ca |

### Team Social Media

| Team | Twitter | Instagram |
|------|---------|-----------|
| Brampton Excelsiors | @ExcelsMajorLax | - |
| Brooklin L.C. | @brooklinLC | @brooklinlc |
| Cobourg Kodiaks | @CobourgKodiaks | @cobourgkodiaks |
| Oakville Rock | @oakvillerock | @oakvillerock |
| Owen Sound North Stars | @mslnorthstars | @mslnorthstars |
| Peterborough Lakers | @PtboLakersLax | @ptbolakerslax |
| Six Nations Chiefs | @sn_chiefs | @sixnationschiefs |

---

## League History

### Name Evolution

| Year | Name |
|------|------|
| 1800s | Canadian Lacrosse Association (field) |
| 1913 | Ontario Amateur Lacrosse Association |
| 1930s | Transitioned to box lacrosse |
| 1939 | Ontario Lacrosse Association Senior A League |
| Present | Major Series Lacrosse (MSL) |

### Notable Dynasties

| Era | Team | Achievements |
|-----|------|--------------|
| 1938-1946 | St. Catharines Athletics | 7 OLA titles, 5 Mann Cups |
| 1951-1957 | Peterborough Trailermen | 8 OLA titles in 9 years, 4 consecutive Mann Cups (1951-54) |
| 2004-2022 | Peterborough Lakers | Multiple Mann Cups (2004-07, 2010, 2012, 2015, 2017-19, 2022) |
| 2013-2016 | Six Nations Chiefs | Mann Cups (2013, 2014, 2016) |

### Historical Milestones

- **1931**: Last field lacrosse Mann Cup (Brampton Excelsiors defeated New Westminster)
- **1930s**: First indoor Mann Cup at Maple Leaf Gardens (Mimico Mountaineers)
- **1957**: Peterborough Trailermen roster suspended (eligibility dispute)

---

## Draft Information

**Location**: `/msl-draft` path (not accessible via direct fetch)

**Available Data**:
- Past draft results (2018-2023)
- Upcoming draft order
- Draft rules and procedures

---

## Data Sources by Era

| Years | Primary Source | Notes |
|-------|---------------|-------|
| 2023-present | GameSheet | `gamesheetstats.com/seasons/{id}` |
| 2019-2022 | DigitalShift Portal | Embedded stats, requires JS |
| 2009-2018 | Pointstreak | `stats.pointstreak.com/prostats/scoreboard.html?leagueid=832` |
| Pre-2009 | Manual/Wikipedia | Historical records only |

---

## Technical Constraints

### Website Access

| Challenge | Description |
|-----------|-------------|
| SPA/Iframe | Stats portal uses client-side rendering |
| Auth Required | DigitalShift API endpoints return 401 |
| JS Dependent | Schedule/standings load via JavaScript |
| Fragmented URLs | `/schedule` shows 2018 title but links to 2025 GameSheet |

### Recommended Extraction Strategy

1. **2023-2025**: Use GameSheet API (documented in MSL_GAMESHEET_DATA_MODEL.md)
2. **2019-2022**: Scrape DigitalShift portal via browser automation
3. **2009-2018**: Use Pointstreak scraper
4. **Teams/History**: Static scrape from main site

---

## External Links

| Purpose | URL |
|---------|-----|
| 2025 Schedule | `https://gamesheetstats.com/seasons/9567/schedule` |
| 2025 Statistics | `https://gamesheetstats.com/seasons/9567/players` |
| 2024 Statistics | `https://gamesheetstats.com/seasons/6007/players` |
| Historical Stats | `https://stats.pointstreak.com/prostats/scoreboard.html?leagueid=832` |
| MSL TV | Available via site navigation |

---

## Next Steps

1. Implement DigitalShift portal scraper (browser automation)
2. Map season IDs for 2019-2022 seasons
3. Cross-reference team IDs across platforms
4. Extract draft data (manual or browser automation)
