import { Effect } from "effect";

const _program = Effect.gen(function* () {
  yield* Effect.log("Hello, World!");
});
