import { Cause, Exit, Option } from "effect";
import { expect } from "vitest";

export const getFailureError = (exit: Exit.Exit<unknown, unknown>): unknown => {
  if (Exit.isSuccess(exit)) {
    throw new Error("Expected failure exit");
  }

  const error = Cause.findErrorOption(exit.cause);
  if (Option.isNone(error)) {
    throw new Error("Expected typed failure cause");
  }

  return error.value;
};

type ErrorConstructor<T extends Error> = abstract new (...args: never[]) => T;

export const expectErrorInstance = <T extends Error>(
  error: unknown,
  ctor: ErrorConstructor<T>,
): T => {
  expect(error).toBeInstanceOf(ctor);
  if (!(error instanceof ctor)) {
    throw new Error(`Expected ${ctor.name}`);
  }
  return error;
};
