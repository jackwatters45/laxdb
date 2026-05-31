import type { CreateDrillInput } from "../drill/drill.schema";
import type { CreatePlayInput } from "../play/play.schema";
import type { CreatePlayerInput } from "../player/player.schema";
import type {
  AddItemInput,
  CreatePracticeInput,
  CreateReviewInput,
} from "../practice/practice.schema";
import type { SchemaInput } from "../util";

export const validCreatePlayer = (
  overrides?: Partial<SchemaInput<typeof CreatePlayerInput>>,
): SchemaInput<typeof CreatePlayerInput> => ({
  name: "Test Player",
  email: "test@example.com",
  ...overrides,
});

export const validCreateDrill = (
  overrides?: Partial<CreateDrillInput>,
): CreateDrillInput => ({
  name: "Test Drill",
  subtitle: null,
  description: null,
  intensity: null,
  contact: null,
  competitive: null,
  playerCount: null,
  durationMinutes: null,
  fieldSpace: null,
  equipment: null,
  diagramUrl: null,
  videoUrl: null,
  coachNotes: null,
  ...overrides,
});

export const validCreatePlay = (
  overrides?: Partial<CreatePlayInput>,
): CreatePlayInput => ({
  name: "Test Play",
  category: "offense",
  formation: null,
  description: null,
  personnelNotes: null,
  diagramUrl: null,
  videoUrl: null,
  ...overrides,
});

export const validCreatePractice = (
  overrides?: Partial<CreatePracticeInput>,
): CreatePracticeInput => ({
  name: "Test Practice",
  date: null,
  description: null,
  notes: null,
  durationMinutes: null,
  location: null,
  ...overrides,
});

export const validAddItem = (
  practicePublicId: SchemaInput<typeof AddItemInput>["practicePublicId"],
  overrides?: Partial<
    Omit<SchemaInput<typeof AddItemInput>, "practicePublicId">
  >,
): SchemaInput<typeof AddItemInput> => ({
  practicePublicId,
  type: "drill",
  ...overrides,
});

export const validCreateReview = (
  practicePublicId: SchemaInput<typeof CreateReviewInput>["practicePublicId"],
  overrides?: Partial<
    Omit<SchemaInput<typeof CreateReviewInput>, "practicePublicId">
  >,
): SchemaInput<typeof CreateReviewInput> => ({
  practicePublicId,
  wentWell: null,
  needsImprovement: null,
  notes: null,
  ...overrides,
});
