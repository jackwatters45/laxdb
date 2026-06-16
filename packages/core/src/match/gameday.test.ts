import { describe, expect, it } from "vitest";

import {
  extractArrayLiteral,
  gamedayDate,
  gamedayMatchName,
  gamedayScore,
} from "./gameday";

describe("extractArrayLiteral", () => {
  it("extracts a flat array after the marker", () => {
    const html = `<script>var matches = [{"FixtureID":"1"}];</script>`;
    expect(extractArrayLiteral(html, "var matches =")).toBe(
      `[{"FixtureID":"1"}]`,
    );
  });

  it("survives ] characters inside string values", () => {
    const payload = `[{"DetailedResults":"<a href=\\"x[1]\\">Match [Centre]</a>","FixtureID":"2"}]`;
    const html = `var matches = ${payload};\nvar other = [1,2];`;
    expect(extractArrayLiteral(html, "var matches =")).toBe(payload);
    expect(
      JSON.parse(extractArrayLiteral(html, "var matches =") ?? ""),
    ).toHaveLength(1);
  });

  it("handles nested arrays", () => {
    const html = `var matches = [[1,2],[3,4]]; tail`;
    expect(extractArrayLiteral(html, "var matches =")).toBe("[[1,2],[3,4]]");
  });

  it("returns null when the marker is missing", () => {
    expect(extractArrayLiteral("<html></html>", "var matches =")).toBeNull();
  });
});

describe("gamedayDate", () => {
  it("parses winter-season Melbourne local time as AEST (+10)", () => {
    const date = gamedayDate("2026-08-19 14:45:00");
    expect(date?.toISOString()).toBe("2026-08-19T04:45:00.000Z");
  });

  it("parses daylight-saving Melbourne local time as AEDT (+11)", () => {
    // Late March is before the first Sunday of April: still AEDT.
    const date = gamedayDate("2026-03-28 15:00:00");
    expect(date?.toISOString()).toBe("2026-03-28T04:00:00.000Z");
  });

  it("handles the spring DST transition", () => {
    // First Sunday of October 2026 is the 4th; AEDT starts 02:00 that day.
    expect(gamedayDate("2026-10-03 15:00:00")?.toISOString()).toBe(
      "2026-10-03T05:00:00.000Z",
    );
    expect(gamedayDate("2026-10-04 15:00:00")?.toISOString()).toBe(
      "2026-10-04T04:00:00.000Z",
    );
  });

  it("returns null for empty or invalid values", () => {
    expect(gamedayDate()).toBeNull();
    expect(gamedayDate("")).toBeNull();
    expect(gamedayDate("not a date")).toBeNull();
  });
});

describe("gamedayScore", () => {
  it("parses numeric scores", () => {
    expect(gamedayScore("9")).toBe(9);
  });

  it("returns null for missing scores", () => {
    expect(gamedayScore("")).toBeNull();
    expect(gamedayScore()).toBeNull();
  });
});

describe("gamedayMatchName", () => {
  it("prefers the formatted name and decodes entities", () => {
    expect(
      gamedayMatchName(
        {
          FixtureID: "1",
          HomeNameFMT: "Malvern&nbsp;Lacrosse&amp;Co ",
        },
        "home",
      ),
    ).toBe("Malvern Lacrosse&Co");
  });
});
