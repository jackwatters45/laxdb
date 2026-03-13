import { Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../error";

import {
  AddItemInput,
  CreatePracticeInput,
  CreateReviewInput,
  DeletePracticeInput,
  GetPracticeInput,
  GetReviewInput,
  ListItemsInput,
  Practice,
  PracticeItem,
  PracticeReview,
  RemoveItemInput,
  ReorderItemsInput,
  UpdateItemInput,
  UpdatePracticeInput,
  UpdateReviewInput,
} from "./practice.schema";

export const PracticeErrors = Schema.Union([
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

export const PracticeContract = {
  // Practice CRUD
  list: {
    success: Schema.Array(Practice),
    error: PracticeErrors,
    payload: Schema.Void,
  },
  get: {
    success: Practice,
    error: PracticeErrors,
    payload: GetPracticeInput,
  },
  create: {
    success: Practice,
    error: PracticeErrors,
    payload: CreatePracticeInput,
  },
  update: {
    success: Practice,
    error: PracticeErrors,
    payload: UpdatePracticeInput,
  },
  delete: {
    success: Practice,
    error: PracticeErrors,
    payload: DeletePracticeInput,
  },

  // Practice items
  listItems: {
    success: Schema.Array(PracticeItem),
    error: PracticeErrors,
    payload: ListItemsInput,
  },
  addItem: {
    success: PracticeItem,
    error: PracticeErrors,
    payload: AddItemInput,
  },
  updateItem: {
    success: PracticeItem,
    error: PracticeErrors,
    payload: UpdateItemInput,
  },
  removeItem: {
    success: PracticeItem,
    error: PracticeErrors,
    payload: RemoveItemInput,
  },
  reorderItems: {
    success: Schema.Array(PracticeItem),
    error: PracticeErrors,
    payload: ReorderItemsInput,
  },

  // Practice review
  getReview: {
    success: PracticeReview,
    error: PracticeErrors,
    payload: GetReviewInput,
  },
  createReview: {
    success: PracticeReview,
    error: PracticeErrors,
    payload: CreateReviewInput,
  },
  updateReview: {
    success: PracticeReview,
    error: PracticeErrors,
    payload: UpdateReviewInput,
  },
} as const;
