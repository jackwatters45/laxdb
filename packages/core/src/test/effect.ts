import { Effect, type Layer } from "effect";

export const makeTestRunner =
  <R>(layer: Layer.Layer<R>) =>
  <A, E>(effect: Effect.Effect<A, E, R>): Promise<A> =>
    Effect.runPromise(
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The provided test layer fully satisfies the effect requirements
      Effect.provide(effect, layer) as Effect.Effect<A, E>,
    );
