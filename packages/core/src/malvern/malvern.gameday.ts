import type { FixtureHomeAway } from "./malvern.schema";

export type GameDayFixtureImport = {
  readonly externalFixtureId: string | null;
  readonly roundLabel: string;
  readonly startsAt: Date | null;
  readonly venue: string | null;
  readonly opponent: string;
  readonly homeAway: FixtureHomeAway;
  readonly malvernScore: number | null;
  readonly opponentScore: number | null;
};

const NBSP = /\u00A0/gu;
const TAG = /<[^>]*>/gu;
const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/gu;
const HTML_LINK = /<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/giu;
const FIXTURE_ID = /fixture=(\d+)/iu;
const ROUND = /^\d+$/u;
const DATE = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})/u;
const TIME = /^(\d{1,2}):(\d{2})/u;
const SCORE = /^\d+$/u;
const MALVERN_HOME_VENUES = ["malvern town hall"];

const decodeEntities = (value: string) =>
  value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&#160;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

const cleanCell = (value: string) =>
  decodeEntities(value)
    .replace(NBSP, " ")
    .replace(MARKDOWN_LINK, "$1 $2")
    .replace(TAG, " ")
    .replaceAll(/\s+/gu, " ")
    .trim();

const normalizeSource = (source: string) =>
  source
    .replace(
      HTML_LINK,
      (_match, href: string, label: string) => ` ${cleanCell(label)} ${href} `,
    )
    .replaceAll(/<br\s*\/?\s*>/giu, "\n")
    .replaceAll(/<\/tr>/giu, "\n")
    .replaceAll(/<\/td>/giu, "\n")
    .replaceAll(/<\/th>/giu, "\n")
    .replace(TAG, "\n");

const textLines = (source: string) =>
  normalizeSource(source)
    .split(/\r?\n/u)
    .map(cleanCell)
    .filter((line) => line !== "" && line !== "—");

const parseDateTime = (dateLine: string, timeLine: string) => {
  const dateMatch = DATE.exec(dateLine);
  const timeMatch = TIME.exec(timeLine);
  if (dateMatch === null || timeMatch === null) return null;

  const day = Number(dateMatch[1] ?? "");
  const month = Number(dateMatch[2] ?? "");
  const rawYear = Number(dateMatch[3] ?? "");
  const hour = Number(timeMatch[1] ?? "");
  const minute = Number(timeMatch[2] ?? "");
  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(rawYear) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return null;
  }

  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
};

const fixtureIdFrom = (lines: readonly string[]) => {
  for (const line of lines) {
    const match = FIXTURE_ID.exec(line);
    if (match !== null) return match[1] ?? null;
  }
  return null;
};

const numberFrom = (value: string | undefined) => {
  if (value === undefined || !SCORE.test(value)) return null;
  return Number(value);
};

const homeAwayFromVenue = (venue: string | null): FixtureHomeAway => {
  if (venue === null) return "unknown";
  const normalized = venue.toLowerCase();
  return MALVERN_HOME_VENUES.some((homeVenue) => normalized.includes(homeVenue))
    ? "home"
    : "away";
};

const opponentFrom = (rowLines: readonly string[]) => {
  const clubLine = rowLines.find(
    (line) =>
      line.includes("Lacrosse") &&
      !line.includes("Malvern Lacrosse Club") &&
      !line.startsWith("team_info.cgi"),
  );
  if (clubLine !== undefined) {
    return clubLine.replace(/\s+team_info\.cgi.*$/u, "").trim();
  }
  return null;
};

const parseFixture = (
  roundLine: string,
  dateLine: string,
  timeLine: string,
  venueLine: string,
  rowLines: readonly string[],
): GameDayFixtureImport | null => {
  const opponent = opponentFrom(rowLines);
  if (opponent === null) return null;

  const opponentIndex = rowLines.findIndex((line) => line.includes(opponent));
  const beforeOpponent =
    opponentIndex > 0 ? rowLines[opponentIndex - 1] : undefined;
  const afterOpponent =
    opponentIndex >= 0 ? rowLines[opponentIndex + 1] : undefined;

  return {
    externalFixtureId: fixtureIdFrom(rowLines),
    roundLabel: `Round ${roundLine}`,
    startsAt: parseDateTime(dateLine, timeLine),
    venue:
      venueLine === "" ? null : venueLine.replace(/\s+comp_info\.cgi.*$/u, ""),
    opponent,
    homeAway: homeAwayFromVenue(venueLine),
    malvernScore: numberFrom(beforeOpponent),
    opponentScore: numberFrom(afterOpponent),
  };
};

const isRoundStart = (lines: readonly string[], index: number) => {
  const roundLine = lines[index] ?? "";
  const dateLine = lines[index + 1] ?? "";
  const timeLine = lines[index + 2] ?? "";
  return ROUND.test(roundLine) && DATE.test(dateLine) && TIME.test(timeLine);
};

export const parseGameDayFixtures = (
  source: string,
): readonly GameDayFixtureImport[] => {
  const lines = textLines(source);
  const fixtures: GameDayFixtureImport[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!isRoundStart(lines, index)) continue;

    const roundLine = lines[index] ?? "";
    const dateLine = lines[index + 1] ?? "";
    const timeLine = lines[index + 2] ?? "";
    const venueLine = lines[index + 3] ?? "";
    const rowLines: string[] = [];

    for (let rowIndex = index + 4; rowIndex < lines.length; rowIndex += 1) {
      if (isRoundStart(lines, rowIndex)) break;
      const rowLine = lines[rowIndex];
      if (rowLine !== undefined) rowLines.push(rowLine);
      if (rowLine?.includes("fixture=") === true) break;
    }

    const fixture = parseFixture(
      roundLine,
      dateLine,
      timeLine,
      venueLine,
      rowLines,
    );
    if (fixture !== null) fixtures.push(fixture);
  }

  return fixtures;
};
