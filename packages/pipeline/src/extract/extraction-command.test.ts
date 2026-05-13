import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { runExtractionCommand } from "./extraction-command";
import type { ExtractionMode } from "./incremental.service";

interface TestManifest {
  readonly source: string;
  readonly lastRun: string;
  readonly version: number;
}

const manifest: TestManifest = {
  source: "test",
  lastRun: "",
  version: 1,
};

describe("runExtractionCommand", () => {
  it("loads and displays status without extracting", async () => {
    let extracted = false;
    let displayedStatus = false;
    let displayedLabel: string | undefined;

    await Effect.runPromise(
      runExtractionCommand({
        force: false,
        incremental: false,
        json: false,
        status: true,
        statusLabel: "Year",
        loadManifest: Effect.succeed(manifest),
        displayStatus: (_manifest, _json, label) =>
          Effect.sync(() => {
            displayedStatus = true;
            displayedLabel = label;
          }),
        extract: () =>
          Effect.sync(() => {
            extracted = true;
            return manifest;
          }),
      }),
    );

    expect(displayedStatus).toBe(true);
    expect(displayedLabel).toBe("Year");
    expect(extracted).toBe(false);
  });

  it("passes force and incremental flags through as extraction modes", async () => {
    const seenModes: ExtractionMode[] = [];

    await Effect.runPromise(
      runExtractionCommand({
        force: true,
        incremental: false,
        json: false,
        status: false,
        loadManifest: Effect.succeed(manifest),
        displayStatus: () => Effect.void,
        extract: (mode) =>
          Effect.sync(() => {
            seenModes.push(mode);
            return manifest;
          }),
      }),
    );

    await Effect.runPromise(
      runExtractionCommand({
        force: false,
        incremental: true,
        json: false,
        status: false,
        loadManifest: Effect.succeed(manifest),
        displayStatus: () => Effect.void,
        extract: (mode) =>
          Effect.sync(() => {
            seenModes.push(mode);
            return manifest;
          }),
      }),
    );

    expect(seenModes).toEqual(["full", "incremental"]);
  });
});
