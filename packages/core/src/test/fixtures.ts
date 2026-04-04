import type { CreateDrillInput } from "../drill/drill.schema";
import type { CreatePlayerInput } from "../player/player.schema";
import type {
  AddItemInput,
  CreatePracticeInput,
  CreateReviewInput,
} from "../practice/practice.schema";

export const validCreatePlayer = (
  overrides?: Partial<CreatePlayerInput>,
): CreatePlayerInput => ({
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
  practicePublicId: string,
  overrides?: Partial<Omit<AddItemInput, "practicePublicId">>,
): AddItemInput => ({
  practicePublicId,
  type: "drill",
  ...overrides,
});

export const validCreateReview = (
  practicePublicId: string,
  overrides?: Partial<Omit<CreateReviewInput, "practicePublicId">>,
): CreateReviewInput => ({
  practicePublicId,
  wentWell: null,
  needsImprovement: null,
  notes: null,
  ...overrides,
});
