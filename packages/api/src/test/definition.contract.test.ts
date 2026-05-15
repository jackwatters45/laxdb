import { describe, expect, it } from "vitest";

import { LaxdbApi } from "../definition";

const apiSourceFiles = import.meta.glob<string>("../**/*.api.ts", {
  eager: true,
  query: "?raw",
  import: "default",
});

const groupNames = () =>
  Object.keys(LaxdbApi.groups).toSorted((a, b) => a.localeCompare(b));

const getOrphanedApiSourceFiles = () => {
  const groups = new Set(groupNames());

  return Object.entries(apiSourceFiles)
    .filter(([, content]) => {
      const match = /HttpApiGroup\.make\("([^"]+)"\)/u.exec(content);
      return match !== null && !groups.has(match[1] ?? "");
    })
    .map(([file]) => file)
    .toSorted((a, b) => a.localeCompare(b));
};

describe("API definition contract", () => {
  it("includes every API group source in LaxdbApi", () => {
    expect(getOrphanedApiSourceFiles()).toEqual([]);
  });
});
