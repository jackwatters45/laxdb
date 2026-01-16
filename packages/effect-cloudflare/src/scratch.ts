import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";

import * as Worker from "./internal/worker";

export default Worker.makeFetchEntryPoint(
  Effect.fn(function* (_req, env, ctx) {
    const maybeValue = yield* env.KV.get("last_accessed");

    // const obj = yield* Effect.tryPromise(() =>
    //   env["~raw"].BUCKET.get("foobar.json"),
    // );
    //

    // yield* env.BUCKET.put("tmp/foobar.json", JSON.stringify({ foo: "bar" }));
    const obj = yield* env.BUCKET.get("foobar.json").pipe(Effect.flatten);

    const value = yield* obj.json<{ foo: "bar" }>();
    console.log({ value });

    ctx.waitUntil(
      Effect.gen(function* () {
        yield* Effect.log("runs after response");
        yield* env.KV.put("last_accessed", `${Date.now()}`);
      }),
    );
    return Option.match(maybeValue, {
      onNone: () =>
        new Response(JSON.stringify({ last_accessed: "Never accessed :(" }), {
          status: 404,
        }),
      onSome: (last_accessed) =>
        new Response(JSON.stringify({ last_accessed }), { status: 200 }),
    });
  }),
  { layer: Layer.empty },
);

export const asyncEntryPoint = {
  async fetch(
    req: Request,
    env: Cloudflare.Env,
    ctx: globalThis.ExecutionContext,
  ) {
    const maybeValue = env.KV.get("last_accessed");

    const _result = await env.DB.batch({} as D1PreparedStatement[]);

    ctx.waitUntil(
      // oxlint-disable-next-line require-await
      (async () => {
        console.log("runs after response");
        env.KV.put("last_accessed", `${Date.now()}`);
      })(),
    );

    if (maybeValue === null) {
      return new Response(
        JSON.stringify({ last_accessed: "Never accessed :(" }),
        {
          status: 404,
        },
      );
    }

    return new Response(JSON.stringify({ last_accessed: maybeValue }), {
      status: 200,
    });
  },
};
