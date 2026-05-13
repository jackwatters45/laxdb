import { Effect } from "effect";

/**
 * Wrap an RPC handlers record so every call logs the method name + duration.
 *
 * Produces log lines like:
 *   INFO: RPC DrillList 42ms    { rpc.method: "DrillList" }
 *   INFO: RPC PracticeGet 2103ms { rpc.method: "PracticeGet" }
 */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any -- generic RPC wrapper must preserve arbitrary handler signatures
type AnyRpcHandler = (...args: readonly any[]) => Effect.Effect<any, any, any>;

const wrapRpcHandler = <THandler extends AnyRpcHandler>(
  name: string,
  handler: THandler,
): THandler =>
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- wrapper preserves the original handler parameter and return types
  ((...args: Parameters<THandler>) =>
    Effect.annotateLogs(
      Effect.gen(function* () {
        const start = Date.now();
        // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment -- generic wrapper preserves the handler's concrete success type
        const result = yield* handler(...args);
        const ms = Date.now() - start;
        yield* Effect.logInfo(`RPC ${name} ${ms}ms`);
        // oxlint-disable-next-line @typescript-eslint/no-unsafe-return -- returning the wrapped handler result preserves the original output type
        return result;
      }),
      "rpc.method",
      name,
    )) as unknown as THandler;

export function withRpcLogging<T extends Record<string, AnyRpcHandler>>(
  handlers: T,
): T {
  const wrappedEntries = Object.entries(handlers).map(([name, handler]) => [
    name,
    wrapRpcHandler(name, handler),
  ]);

  // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- fromEntries preserves the original handler keys and wrapped signatures
  return Object.fromEntries(wrappedEntries) as T;
}
