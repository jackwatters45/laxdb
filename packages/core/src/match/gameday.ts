import { Context, Effect, Layer, Option, Schema } from "effect";

/**
 * Client for GameDay (websites.mygameday.app), which hosts Lacrosse Victoria
 * fixtures. Fixture pages embed the full match list as a `var matches = [...]`
 * JSON literal; the competitions page is plain server-rendered HTML.
 */

export class GamedayError extends Schema.TaggedErrorClass<GamedayError>()(
  "GamedayError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
    code: Schema.optional(Schema.Number),
  },
) {}

/** Lacrosse Victoria association client id on GameDay. */
export const LACROSSE_VICTORIA_CLIENT = "0-1064-0-0-0";
export const GAMEDAY_BASE_URL = "https://websites.mygameday.app";

const BASE_URL = GAMEDAY_BASE_URL;

// GameDay 403s default fetch user agents; a browser UA is required.
const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
} as const;

export const GamedayMatch = Schema.Struct({
  FixtureID: Schema.String,
  Round: Schema.optional(Schema.String),
  TimeDateRaw: Schema.optional(Schema.String),
  HomeID: Schema.optional(Schema.String),
  AwayID: Schema.optional(Schema.String),
  HomeNameFMT: Schema.optional(Schema.String),
  AwayNameFMT: Schema.optional(Schema.String),
  HomeName: Schema.optional(Schema.String),
  AwayName: Schema.optional(Schema.String),
  VenueName: Schema.optional(Schema.String),
  MatchStatus: Schema.optional(Schema.String),
  HomeScore: Schema.optional(Schema.String),
  AwayScore: Schema.optional(Schema.String),
  CompID: Schema.optional(Schema.String),
  CompName: Schema.optional(Schema.String),
  isBye: Schema.optional(Schema.Number),
});
export type GamedayMatch = typeof GamedayMatch.Type;

export class GamedaySeason extends Schema.Class<GamedaySeason>("GamedaySeason")(
  {
    seasonId: Schema.String,
    name: Schema.String,
  },
) {}

export class GamedayCompetition extends Schema.Class<GamedayCompetition>(
  "GamedayCompetition",
)({
  compId: Schema.String,
  name: Schema.String,
}) {}

export class GamedayTeam extends Schema.Class<GamedayTeam>("GamedayTeam")({
  teamId: Schema.String,
  name: Schema.String,
}) {}

export class GamedayClub extends Schema.Class<GamedayClub>("GamedayClub")({
  name: Schema.String,
}) {}

export class GamedayTeamCompetition extends Schema.Class<GamedayTeamCompetition>(
  "GamedayTeamCompetition",
)({
  compId: Schema.String,
  compName: Schema.String,
  teamId: Schema.String,
  teamName: Schema.String,
}) {}

export class GamedayPlayer extends Schema.Class<GamedayPlayer>("GamedayPlayer")(
  {
    playerId: Schema.String,
    name: Schema.String,
    gamesPlayed: Schema.NullOr(Schema.Number),
    totalAssists: Schema.NullOr(Schema.Number),
    totalScore: Schema.NullOr(Schema.Number),
  },
) {}

export class GamedayLadderRow extends Schema.Class<GamedayLadderRow>(
  "GamedayLadderRow",
)({
  position: Schema.Number,
  teamId: Schema.NullOr(Schema.String),
  teamName: Schema.String,
  played: Schema.Number,
  wins: Schema.Number,
  losses: Schema.Number,
  draws: Schema.Number,
  byes: Schema.Number,
  forfeitsFor: Schema.Number,
  forfeitsGiven: Schema.Number,
  goalsFor: Schema.Number,
  goalsAgainst: Schema.Number,
  goalDifference: Schema.Number,
  percentage: Schema.Number,
  premiershipPoints: Schema.Number,
}) {}

export class GamedayLadder extends Schema.Class<GamedayLadder>("GamedayLadder")(
  {
    sourceUploadedAt: Schema.NullOr(Schema.String),
    rows: Schema.Array(GamedayLadderRow),
  },
) {}

/**
 * Extract a balanced JSON array literal that starts right after `marker`.
 * Bracket-counts through strings/escapes — the array contains HTML snippets
 * with `]` characters, so a lazy regex is not safe.
 */
export const extractArrayLiteral = (
  source: string,
  marker: string,
): string | null => {
  const start = source.indexOf(marker);
  if (start === -1) return null;
  const open = source.indexOf("[", start + marker.length);
  if (open === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "[") {
      depth++;
    } else if (ch === "]") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return null;
};

const decodeEntities = (value: string) =>
  value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

const fetchPage = (url: string) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, { headers: REQUEST_HEADERS });
      if (!response.ok) {
        throw new Error(`GameDay returned ${response.status} for ${url}`);
      }
      return response.text();
    },
    catch: (cause) =>
      new GamedayError({
        message:
          cause instanceof Error ? cause.message : "GameDay fetch failed",
        cause,
      }),
  });

const parseMatches = (html: string, compId: string) =>
  Effect.gen(function* () {
    const literal = extractArrayLiteral(html, "var matches =");
    if (literal === null) {
      if (/class=["'][^"']*\bno-fixtures\b[^"']*["']/u.test(html)) return [];
      return yield* Effect.fail(
        new GamedayError({
          message: `No matches payload on GameDay fixture page for comp ${compId}`,
        }),
      );
    }
    const parsed = yield* Effect.try({
      try: (): unknown => JSON.parse(literal),
      catch: (cause) =>
        new GamedayError({
          message: "Failed to parse GameDay matches JSON",
          cause,
        }),
    });
    return yield* Schema.decodeUnknownEffect(Schema.Array(GamedayMatch))(
      parsed,
    ).pipe(
      Effect.mapError(
        (cause) =>
          new GamedayError({
            message: "GameDay matches payload had unexpected shape",
            cause,
          }),
      ),
    );
  });

const COMP_ROW_RE =
  /<\/svg>\s*([^<]+?)\s*<\/div>\s*<\/td>\s*<td class="flr-list-nav">[\s\S]*?compID=(\d+)/gu;

const SEASON_RE = /seasonID=(\d+)[^>]*>([^<]+)/gu;

const PLAYER_LINK_RE = /<a[^>]+pID=(\d+)[^>]*>([^<]+)<\/a>/gu;

const stripTags = (value: string) =>
  decodeEntities(value.replaceAll(/<[^>]+>/gu, "")).trim();

const parseOptionalInt = (value: string): number | null => {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const TABLE_RE = /<table[^>]*>([\s\S]*?)<\/table>/giu;
const TABLE_ROW_RE = /<tr[^>]*>([\s\S]*?)<\/tr>/giu;
const TABLE_CELL_RE = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/giu;

const normalizedHeading = (value: string) =>
  stripTags(value).replaceAll(/\s+/gu, " ").toLocaleUpperCase();

const requiredLadderHeadings = [
  "POS",
  "TEAM",
  "P",
  "W",
  "L",
  "D",
  "B",
  "FF",
  "FG",
  "FOR",
  "AGST",
  "GD",
  "%",
  "PTS",
] as const;

export const parseLadder = (html: string, compId: string) =>
  Effect.gen(function* () {
    for (const tableMatch of html.matchAll(TABLE_RE)) {
      const tableHtml = tableMatch[1];
      if (tableHtml === undefined) continue;
      const rows = [...tableHtml.matchAll(TABLE_ROW_RE)];
      const headerIndex = rows.findIndex((row) => {
        const rowHtml = row[1] ?? "";
        const headings = new Set(
          [...rowHtml.matchAll(TABLE_CELL_RE)].map((cell) =>
            normalizedHeading(cell[1] ?? ""),
          ),
        );
        return requiredLadderHeadings.every((heading) => headings.has(heading));
      });
      if (headerIndex === -1) continue;

      const headerHtml = rows[headerIndex]?.[1] ?? "";
      const headings = [...headerHtml.matchAll(TABLE_CELL_RE)].map((cell) =>
        normalizedHeading(cell[1] ?? ""),
      );
      const column = (heading: string) => headings.indexOf(heading);
      const parsedRows: GamedayLadderRow[] = [];

      for (const row of rows.slice(headerIndex + 1)) {
        const rowHtml = row[1];
        if (rowHtml === undefined) continue;
        const cells = [...rowHtml.matchAll(TABLE_CELL_RE)].map((cell) =>
          stripTags(cell[1] ?? ""),
        );
        const value = (heading: string) => cells[column(heading)] ?? "";
        const position = parseOptionalInt(value("POS"));
        const teamName = value("TEAM");
        if (position === null || teamName === "") continue;
        const integer = (heading: string) => parseOptionalInt(value(heading));
        const played = integer("P");
        const wins = integer("W");
        const losses = integer("L");
        const draws = integer("D");
        const byes = integer("B");
        const forfeitsFor = integer("FF");
        const forfeitsGiven = integer("FG");
        const goalsFor = integer("FOR");
        const goalsAgainst = integer("AGST");
        const goalDifference = integer("GD");
        const premiershipPoints = integer("PTS");
        if (
          played === null ||
          wins === null ||
          losses === null ||
          draws === null ||
          byes === null ||
          forfeitsFor === null ||
          forfeitsGiven === null ||
          goalsFor === null ||
          goalsAgainst === null ||
          goalDifference === null ||
          premiershipPoints === null
        ) {
          return yield* Effect.fail(
            new GamedayError({
              message: `GameDay ladder for comp ${compId} contained a malformed numeric row`,
            }),
          );
        }
        const percentage = Number.parseFloat(value("%"));
        if (Number.isNaN(percentage)) {
          return yield* Effect.fail(
            new GamedayError({
              message: `GameDay ladder for comp ${compId} contained a malformed percentage`,
            }),
          );
        }
        const teamId =
          rowHtml.match(/team_info\.cgi[^>]*?c=(?:\d+-){4}(\d+)/iu)?.[1] ??
          rowHtml.match(/team_info\.cgi[^>]*?[?&]id=(\d+)/iu)?.[1] ??
          rowHtml.match(/[?&](?:amp;)?teamID=(\d+)/iu)?.[1] ??
          null;
        parsedRows.push(
          new GamedayLadderRow({
            position,
            teamId,
            teamName,
            played,
            wins,
            losses,
            draws,
            byes,
            forfeitsFor,
            forfeitsGiven,
            goalsFor,
            goalsAgainst,
            goalDifference,
            percentage,
            premiershipPoints,
          }),
        );
      }
      if (parsedRows.length > 0) {
        const sourceUploadedAt =
          stripTags(
            html.match(
              /Last Uploaded\s*:?\s*(?:<\/[^>]+>\s*)?([^<]+)/iu,
            )?.[1] ?? "",
          ) || null;
        return new GamedayLadder({ sourceUploadedAt, rows: parsedRows });
      }
    }
    return yield* Effect.fail(
      new GamedayError({
        message: `No valid ladder table on GameDay page for comp ${compId}`,
      }),
    );
  });

const parsePlayerLinks = (html: string) => {
  const players = new Map<string, string>();
  for (const match of html.matchAll(PLAYER_LINK_RE)) {
    const playerId = match[1];
    const name = match[2];
    if (playerId !== undefined && name !== undefined) {
      players.set(playerId, decodeEntities(name).trim());
    }
  }
  return players;
};

export const parseStatsRows = (html: string) => {
  const stats = new Map<
    string,
    {
      readonly fallbackName: string;
      readonly gamesPlayed: number | null;
      readonly totalAssists: number | null;
      readonly totalScore: number | null;
    }
  >();
  for (const tableMatch of html.matchAll(TABLE_RE)) {
    const tableHtml = tableMatch[1];
    if (tableHtml === undefined) continue;
    const rows = [...tableHtml.matchAll(TABLE_ROW_RE)];
    const headerIndex = rows.findIndex((row) => {
      const headings = new Set(
        [...(row[1] ?? "").matchAll(TABLE_CELL_RE)].map((cell) =>
          normalizedHeading(cell[1] ?? ""),
        ),
      );
      return (
        headings.has("M") &&
        headings.has("TA") &&
        (headings.has("TSC") || headings.has("SCORE"))
      );
    });
    if (headerIndex === -1) continue;
    const headings = [
      ...(rows[headerIndex]?.[1] ?? "").matchAll(TABLE_CELL_RE),
    ].map((cell) => normalizedHeading(cell[1] ?? ""));
    const nameIndex = headings.findIndex((heading) =>
      heading.includes("PLAYER"),
    );
    const gamesIndex = headings.indexOf("M");
    const assistsIndex = headings.indexOf("TA");
    const scoreIndex = headings.includes("TSC")
      ? headings.indexOf("TSC")
      : headings.indexOf("SCORE");
    for (const row of rows.slice(headerIndex + 1)) {
      const rowHtml = row[1];
      if (rowHtml === undefined) continue;
      const playerId = rowHtml.match(/pID=(\d+)/u)?.[1];
      if (playerId === undefined) continue;
      const cells = [...rowHtml.matchAll(TABLE_CELL_RE)].map((cell) =>
        stripTags(cell[1] ?? ""),
      );
      stats.set(playerId, {
        fallbackName: cells[nameIndex] ?? "",
        gamesPlayed: parseOptionalInt(cells[gamesIndex] ?? ""),
        totalAssists: parseOptionalInt(cells[assistsIndex] ?? ""),
        totalScore: parseOptionalInt(cells[scoreIndex] ?? ""),
      });
    }
  }
  return stats;
};

export class GamedayClient extends Context.Service<GamedayClient>()(
  "GamedayClient",
  {
    make: Effect.gen(function* () {
      const fetchCompetitionList = (options?: {
        readonly seasonId?: string | undefined;
      }) =>
        Effect.gen(function* () {
          const season =
            options?.seasonId === undefined
              ? ""
              : `&seasonID=${options.seasonId}`;
          const html = yield* fetchPage(
            `${BASE_URL}/assoc_page.cgi?c=${LACROSSE_VICTORIA_CLIENT}&a=COMPS${season}`,
          );
          const comps: GamedayCompetition[] = [];
          for (const match of html.matchAll(COMP_ROW_RE)) {
            const name = match[1];
            const compId = match[2];
            if (name !== undefined && compId !== undefined) {
              comps.push(
                new GamedayCompetition({
                  compId,
                  name: decodeEntities(name.trim()),
                }),
              );
            }
          }
          if (comps.length === 0) {
            return yield* Effect.fail(
              new GamedayError({
                message: "No competitions found on GameDay page",
              }),
            );
          }
          return comps;
        });

      const fetchFixtureList = (compId: string) =>
        Effect.gen(function* () {
          const pageUrl = (round: number, pool?: string) =>
            `${BASE_URL}/comp_info.cgi?a=FIXTURE&compID=${compId}&c=${LACROSSE_VICTORIA_CLIENT}&round=${round}${pool === undefined ? "" : `&pool=${pool}`}`;

          const firstPage = yield* fetchPage(pageUrl(0));
          const poolIds = [
            ...new Set(
              [...firstPage.matchAll(/[?&](?:amp;)?pool=(\d+)/gu)].flatMap(
                (match) => (match[1] === undefined ? [] : [match[1]]),
              ),
            ),
          ];
          const poolPages = yield* Effect.forEach(
            poolIds,
            (pool) =>
              Effect.map(fetchPage(pageUrl(0, pool)), (html) => ({
                html,
                pool,
              })),
            { concurrency: 4 },
          );
          const pages = [{ html: firstPage, pool: undefined }, ...poolPages];
          const pageMatches = yield* Effect.forEach(
            pages,
            ({ html, pool }) =>
              Effect.gen(function* () {
                const initial = yield* parseMatches(html, compId);
                const rounds = [
                  ...new Set(
                    [...html.matchAll(/round=(\d+)/gu)]
                      .map((match) => Number(match[1]))
                      .filter((round) => round > 0),
                  ),
                ];
                const perRound = yield* Effect.forEach(
                  rounds,
                  (round) =>
                    fetchPage(pageUrl(round, pool)).pipe(
                      Effect.flatMap((roundHtml) =>
                        parseMatches(roundHtml, compId),
                      ),
                    ),
                  { concurrency: 4 },
                );
                return [...initial, ...perRound.flat()];
              }),
            { concurrency: 4 },
          );

          const byFixtureId = new Map<string, GamedayMatch>();
          for (const match of pageMatches.flat()) {
            byFixtureId.set(match.FixtureID, match);
          }
          return [...byFixtureId.values()];
        });

      return {
        /** Available GameDay seasons, newest first. */
        fetchSeasons: () =>
          Effect.gen(function* () {
            const html = yield* fetchPage(
              `${BASE_URL}/assoc_page.cgi?c=${LACROSSE_VICTORIA_CLIENT}&a=COMPS`,
            );
            const seasons: GamedaySeason[] = [];
            const seen = new Set<string>();
            for (const match of html.matchAll(SEASON_RE)) {
              const seasonId = match[1];
              const name = match[2];
              if (
                seasonId !== undefined &&
                name !== undefined &&
                !seen.has(seasonId)
              ) {
                seen.add(seasonId);
                seasons.push(
                  new GamedaySeason({
                    seasonId,
                    name: decodeEntities(name.trim()),
                  }),
                );
              }
            }
            return seasons;
          }),

        /** Competitions for a season (current season when no seasonId). */
        fetchCompetitions: fetchCompetitionList,

        /**
         * All matches for a competition, every round. Each fixture page only
         * embeds the displayed round, so this sweeps the round links found on
         * the default page and merges the results.
         */
        fetchFixtures: fetchFixtureList,

        /** Published competition ladder, parsed by table headings. */
        fetchLadder: (compId: string) =>
          fetchPage(
            `${BASE_URL}/comp_info.cgi?a=LADDER&c=${LACROSSE_VICTORIA_CLIENT}&compID=${compId}`,
          ).pipe(Effect.flatMap((html) => parseLadder(html, compId))),

        /** Teams appearing in a GameDay competition's fixture list. */
        fetchTeams: (compId: string) =>
          Effect.map(fetchFixtureList(compId), gamedayTeamsFromMatches),

        /** Roster and basic player stats for a GameDay team. */
        fetchRoster: (input: {
          readonly compId: string;
          readonly teamId: string;
        }) =>
          Effect.gen(function* () {
            const base = `${BASE_URL}/team_info.cgi?id=${input.teamId}&c=${LACROSSE_VICTORIA_CLIENT.replace("-0-0-0", `-0-${input.compId}-0`)}`;
            const playersHtml = yield* fetchPage(`${base}&a=PLAYERS`);
            const statsHtml = yield* fetchPage(`${base}&a=STATS`).pipe(
              Effect.option,
            );
            const names = parsePlayerLinks(playersHtml);
            const stats = Option.match(statsHtml, {
              onNone: () => parseStatsRows(""),
              onSome: parseStatsRows,
            });
            const playerIds = new Set([...names.keys(), ...stats.keys()]);
            return [...playerIds]
              .map((playerId) => {
                const stat = stats.get(playerId);
                const name = names.get(playerId) ?? stat?.fallbackName ?? "";
                return new GamedayPlayer({
                  playerId,
                  name: decodeEntities(name).trim(),
                  gamesPlayed: stat?.gamesPlayed ?? null,
                  totalAssists: stat?.totalAssists ?? null,
                  totalScore: stat?.totalScore ?? null,
                });
              })
              .filter((player) => player.name !== "")
              .toSorted((a, b) => a.name.localeCompare(b.name));
          }),

        /** Club names appearing anywhere in the visible GameDay season. */
        fetchClubs: (options?: { readonly seasonId?: string | undefined }) =>
          Effect.gen(function* () {
            const comps = yield* fetchCompetitionList(options);
            const teamsByComp = yield* Effect.forEach(
              comps,
              (comp) =>
                Effect.map(
                  fetchFixtureList(comp.compId),
                  gamedayTeamsFromMatches,
                ),
              { concurrency: 4 },
            );
            const names = new Set<string>();
            for (const team of teamsByComp.flat()) {
              names.add(team.name);
            }
            return [...names]
              .map((name) => new GamedayClub({ name }))
              .toSorted((a, b) => a.name.localeCompare(b.name));
          }),

        /** Competition entries where any selected GameDay club/team name appears. */
        fetchCompetitionsForClubs: (input: {
          readonly clubNames: readonly string[];
          readonly seasonId?: string | undefined;
        }) =>
          Effect.gen(function* () {
            const selectedNames = new Set(input.clubNames);
            const comps = yield* fetchCompetitionList({
              seasonId: input.seasonId,
            });
            const entries = yield* Effect.forEach(
              comps,
              (comp) =>
                Effect.map(fetchFixtureList(comp.compId), (matches) =>
                  gamedayTeamsFromMatches(matches)
                    .filter((team) => selectedNames.has(team.name))
                    .map(
                      (team) =>
                        new GamedayTeamCompetition({
                          compId: comp.compId,
                          compName: comp.name,
                          teamId: team.teamId,
                          teamName: team.name,
                        }),
                    ),
                ),
              { concurrency: 4 },
            );
            return entries.flat();
          }),
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}

export const gamedayTeamsFromMatches = (
  matches: readonly GamedayMatch[],
): GamedayTeam[] => {
  const teams = new Map<string, string>();
  for (const match of matches) {
    if (match.HomeID !== undefined && match.HomeID !== "") {
      teams.set(match.HomeID, gamedayMatchName(match, "home"));
    }
    if (match.AwayID !== undefined && match.AwayID !== "") {
      teams.set(match.AwayID, gamedayMatchName(match, "away"));
    }
  }
  return [...teams.entries()]
    .map(([teamId, name]) => new GamedayTeam({ teamId, name }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
};

export const gamedayMatchName = (
  match: GamedayMatch,
  side: "home" | "away",
) => {
  const name =
    side === "home"
      ? (match.HomeNameFMT ?? match.HomeName ?? "")
      : (match.AwayNameFMT ?? match.AwayName ?? "");
  return decodeEntities(name).trim();
};

const MELBOURNE_TZ = "Australia/Melbourne";

const melbourneOffsetMs = (instant: Date): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MELBOURNE_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((p) => p.type === type);
    return part === undefined ? 0 : Number(part.value);
  };
  const wallClockAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
  );
  return wallClockAsUtc - instant.getTime();
};

/**
 * GameDay datetimes are Melbourne local. The winter season runs in AEST
 * (+10:00) but early/late rounds can fall in AEDT (+11:00), so the offset is
 * resolved per-date via Intl rather than hardcoded.
 */
export const gamedayDate = (raw?: string): Date | null => {
  if (raw === undefined || raw === "") return null;
  const wallClock = new Date(`${raw.replace(" ", "T")}Z`);
  if (Number.isNaN(wallClock.getTime())) return null;
  // First pass guesses the offset from the wall-clock instant; the second
  // re-evaluates at the guessed UTC instant to settle DST boundary dates.
  const guess = wallClock.getTime() - melbourneOffsetMs(wallClock);
  return new Date(wallClock.getTime() - melbourneOffsetMs(new Date(guess)));
};

export const gamedayScore = (raw?: string): number | null => {
  if (raw === undefined || raw === "") return null;
  const score = Number.parseInt(raw, 10);
  return Number.isNaN(score) ? null : score;
};
