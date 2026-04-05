import { ServiceMap } from "effect";

/**
 * Effect's HTTP handler now accepts a per-request service context.
 *
 * Our handlers don't currently require any request-scoped services beyond the
 * layers already provided when wiring the router, so an empty context is the
 * correct runtime value here.
 */
export const emptyRequestContext =
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ServiceMap.empty() is the correct runtime value, but Effect's generic cannot preserve the narrower empty type through handler call sites
  ServiceMap.empty() as ServiceMap.ServiceMap<unknown>;
