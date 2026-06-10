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
  it("parses Melbourne local time as AEST", () => {
    const date = gamedayDate("2026-08-19 14:45:00");
    expect(date?.toISOString()).toBe("2026-08-19T04:45:00.000Z");
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
