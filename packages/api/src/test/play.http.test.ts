import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@effect/vitest";

import { expectRecord, expectStringProp } from "./assertions";
import {
  post,
  startTestServer,
  truncateAllTables,
  type TestServer,
} from "./server";

let s: TestServer;

beforeAll(async () => {
  s = await startTestServer();
});
afterAll(async () => {
  await s?.cleanup();
});
beforeEach(async () => {
  await truncateAllTables();
});

const diagram = {
  version: 1,
  field: {
    discipline: "mens",
    view: "full",
    template: "mens-full",
    orientation: "attack-up",
  },
  actors: [{ id: "player-1", kind: "player", side: "offense", label: "A1" }],
  frames: [
    {
      id: "frame-1",
      name: "Set",
      durationMs: 1_000,
      actorStates: [{ actorId: "player-1", position: { x: 0.5, y: 0.75 } }],
      actions: [
        {
          id: "cut-1",
          type: "cut",
          start: { x: 0.5, y: 0.75 },
          end: { x: 0.4, y: 0.5 },
          actorId: "player-1",
          targetActorId: null,
        },
      ],
    },
  ],
};

const invalidDiagramCases = () => {
  const frame = diagram.frames[0];
  const actor = diagram.actors[0];
  const action = frame?.actions[0];
  const actorState = frame?.actorStates[0];
  if (
    frame === undefined ||
    actor === undefined ||
    action === undefined ||
    actorState === undefined
  ) {
    throw new Error("The valid diagram fixture must contain diagram entities");
  }

  return [
    {
      name: "duplicate actor id",
      value: { ...diagram, actors: [...diagram.actors, { ...actor }] },
    },
    {
      name: "duplicate frame id",
      value: {
        ...diagram,
        frames: [
          ...diagram.frames,
          {
            ...frame,
            name: "Second set",
            actions: frame.actions.map((item) => ({
              ...item,
              id: `${item.id}-second`,
            })),
          },
        ],
      },
    },
    {
      name: "duplicate action id",
      value: {
        ...diagram,
        frames: diagram.frames.map((item) => ({
          ...item,
          actions: [...item.actions, { ...action }],
        })),
      },
    },
    {
      name: "duplicate actor state",
      value: {
        ...diagram,
        frames: diagram.frames.map((item) => ({
          ...item,
          actorStates: [...item.actorStates, { ...actorState }],
        })),
      },
    },
    {
      name: "dangling actor state reference",
      value: {
        ...diagram,
        frames: diagram.frames.map((item) => ({
          ...item,
          actorStates: item.actorStates.map((state, index) =>
            index === 0 ? { ...state, actorId: "missing-actor" } : state,
          ),
        })),
      },
    },
    {
      name: "dangling action actor reference",
      value: {
        ...diagram,
        frames: diagram.frames.map((item) => ({
          ...item,
          actions: item.actions.map((itemAction, index) =>
            index === 0
              ? { ...itemAction, actorId: "missing-actor" }
              : itemAction,
          ),
        })),
      },
    },
    {
      name: "dangling target actor reference",
      value: {
        ...diagram,
        frames: diagram.frames.map((item) => ({
          ...item,
          actions: item.actions.map((itemAction, index) =>
            index === 0
              ? { ...itemAction, targetActorId: "missing-target" }
              : itemAction,
          ),
        })),
      },
    },
  ];
};

const minimalPlay = {
  name: "Invert 2-3-1",
  category: "offense",
  formation: null,
  description: null,
  personnelNotes: null,
  diagram: null,
  diagramUrl: null,
  videoUrl: null,
};

describe("POST /api/plays", () => {
  it("returns empty list", async () => {
    const { status, data } = await post(s.url, "/api/plays");
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns all plays after create", async () => {
    await post(s.url, "/api/plays/create", minimalPlay);
    await post(s.url, "/api/plays/create", {
      ...minimalPlay,
      name: "Clear Pressure",
      category: "clear",
    });

    const { status, data } = await post(s.url, "/api/plays");

    expect(status).toBe(200);
    expect(data).toHaveLength(2);
    const plays = data.map(expectRecord);
    expect(plays.every((play) => !("diagram" in play))).toBe(true);
  });
});

describe("POST /api/plays/create", () => {
  it("creates a play with minimal fields", async () => {
    const { status, data } = await post(
      s.url,
      "/api/plays/create",
      minimalPlay,
    );

    expect(status).toBe(200);
    const play = expectRecord(data);
    expect(play.name).toBe("Invert 2-3-1");
    expect(play.publicId).toHaveLength(12);
    expect(play.tags).toEqual([]);
  });

  it("creates a play with all fields", async () => {
    const { status, data } = await post(s.url, "/api/plays/create", {
      ...minimalPlay,
      name: "Ride Red",
      category: "ride",
      formation: "10-man",
      description: "Jump the first pass.",
      personnelNotes: "Long-stick middie triggers.",
      tags: ["pressure", "sideline"],
      diagram,
      diagramUrl: "https://example.com/ride.png",
      videoUrl: "https://example.com/ride.mp4",
    });

    expect(status).toBe(200);
    const play = expectRecord(data);
    expect(play.name).toBe("Ride Red");
    expect(play.category).toBe("ride");
    expect(play.formation).toBe("10-man");
    expect(play.tags).toEqual(["pressure", "sideline"]);
    expect(play.diagram).toEqual(diagram);
  });

  it.each(invalidDiagramCases())(
    "rejects $name",
    async ({ value: invalidDiagram }) => {
      const { status } = await post(s.url, "/api/plays/create", {
        ...minimalPlay,
        diagram: invalidDiagram,
      });

      expect(status).toBe(400);
    },
  );

  it("returns error for empty name", async () => {
    const { status } = await post(s.url, "/api/plays/create", {
      ...minimalPlay,
      name: "",
    });

    expect(status).toBe(400);
  });
});

describe("POST /api/plays/get", () => {
  it("gets a play by publicId", async () => {
    const { data: created } = await post(
      s.url,
      "/api/plays/create",
      minimalPlay,
    );
    const publicId = expectStringProp(created, "publicId");

    const { status, data } = await post(s.url, "/api/plays/get", { publicId });

    expect(status).toBe(200);
    expect(expectRecord(data).name).toBe("Invert 2-3-1");
  });

  it("returns error for nonexistent play", async () => {
    const { status } = await post(s.url, "/api/plays/get", {
      publicId: "AbCdEfGhIjKl",
    });

    expect(status).toBe(404);
  });
});

describe("POST /api/plays/update", () => {
  it("updates a play", async () => {
    const { data: created } = await post(
      s.url,
      "/api/plays/create",
      minimalPlay,
    );
    const publicId = expectStringProp(created, "publicId");

    const { status, data } = await post(s.url, "/api/plays/update", {
      publicId,
      name: "Updated Play",
      category: "transition",
      tags: ["fast-break"],
      diagram,
    });

    expect(status).toBe(200);
    const play = expectRecord(data);
    expect(play.name).toBe("Updated Play");
    expect(play.category).toBe("transition");
    expect(play.tags).toEqual(["fast-break"]);
    expect(play.diagram).toEqual(diagram);
  });

  it("returns error for nonexistent play", async () => {
    const { status } = await post(s.url, "/api/plays/update", {
      publicId: "AbCdEfGhIjKl",
      name: "Missing",
    });

    expect(status).toBe(404);
  });
});

describe("POST /api/plays/delete", () => {
  it("deletes a play", async () => {
    const { data: created } = await post(
      s.url,
      "/api/plays/create",
      minimalPlay,
    );
    const publicId = expectStringProp(created, "publicId");

    const { status, data } = await post(s.url, "/api/plays/delete", {
      publicId,
    });
    const afterDelete = await post(s.url, "/api/plays/get", { publicId });

    expect(status).toBe(200);
    expect(expectRecord(data).publicId).toBe(publicId);
    expect(afterDelete.status).toBe(404);
  });

  it("returns error for nonexistent play", async () => {
    const { status } = await post(s.url, "/api/plays/delete", {
      publicId: "AbCdEfGhIjKl",
    });

    expect(status).toBe(404);
  });
});
