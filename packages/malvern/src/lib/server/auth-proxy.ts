import { Effect } from "effect";

import { env } from "../../env";

const isLocalRequest = (request: Request) => {
  const host = new URL(request.url).hostname;
  return host === "localhost" || host === "127.0.0.1";
};

const apiOrigin = (request: Request) =>
  isLocalRequest(request) ? "http://localhost:1437" : "http://api";

const toApiRequest = (request: Request) => {
  const source = new URL(request.url);
  const target = new URL(
    `${source.pathname}${source.search}`,
    apiOrigin(request),
  );
  const forwarded = new Request(target, request);

  if (!forwarded.headers.has("origin")) {
    forwarded.headers.set("origin", source.origin);
  }

  return forwarded;
};

const logBadResponse = (label: string, response: Response) =>
  response.status < 400
    ? Effect.succeed(response)
    : Effect.promise(() =>
        response
          .clone()
          .text()
          .catch(() => ""),
      ).pipe(
        Effect.tap((body) =>
          Effect.sync(() => {
            console.log(`[${label}] returned ${response.status}`, body);
          }),
        ),
        Effect.as(response),
      );

export const traceResponse = (
  label: string,
  effect: Effect.Effect<Response, unknown>,
) =>
  Effect.runPromise(
    effect.pipe(
      Effect.flatMap((response) => logBadResponse(label, response)),
      Effect.matchEffect({
        onFailure: (error) =>
          Effect.sync(() => {
            const detail =
              error instanceof Error
                ? (error.stack ?? error.message)
                : String(error);
            console.log(`[${label}] failed:`, detail);
            return new Response(`${label} failed: ${detail}`, { status: 500 });
          }),
        onSuccess: Effect.succeed,
      }),
    ),
  );

export const forwardApiRequest = (request: Request) =>
  traceResponse(
    "api.proxy",
    Effect.promise(() =>
      isLocalRequest(request)
        ? fetch(toApiRequest(request))
        : env.API.fetch(toApiRequest(request)),
    ),
  );

export const forwardAuthRequest = (request: Request) =>
  forwardApiRequest(request);
