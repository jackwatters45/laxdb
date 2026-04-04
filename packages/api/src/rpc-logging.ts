import { Effect } from "effect";

/**
 * Wrap an RPC handlers record so every call logs the method name + duration.
 *
 * Produces log lines like:
 *   INFO: RPC DrillList 42ms    { rpc.method: "DrillList" }
 *   INFO: RPC PracticeGet 2103ms { rpc.method: "PracticeGet" }
 */
export function withRpcLogging<
  T extends Record<
    string,
    (...args: readonly any[]) => Effect.Effect<any, any, any>
  >,
>(handlers: T): T {
  const wrapped = {} as Record<
    string,
    (...args: readonly any[]) => Effect.Effect<any, any, any>
  >;

  for (const [name, handler] of Object.entries(handlers)) {
    wrapped[name] = (...args: readonly any[]) =>
      Effect.annotateLogs(
        Effect.gen(function* () {
          const start = Date.now();
          const result = yield* handler(...args);
          const ms = Date.now() - start;
          yield* Effect.logInfo(`RPC ${name} ${ms}ms`);
          return result;
        }),
        "rpc.method",
        name,
      );
  }

  return wrapped as T;
}
