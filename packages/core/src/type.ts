import type { RequestHeaderMap, TypedHeaders } from "fetchdts";

/**
 * Union type for HTTP request headers. Accepts both typed headers (fetchdts) and native Headers for consumer flexibility.
 *
 * Use this type when accepting headers from different sources:
 * - `TypedHeaders<RequestHeaderMap>`: Type-safe headers from fetchdts with autocomplete for standard HTTP headers. TanStack Start's `getRequestHeaders() use TypedHeaders<RequestHeaderMap>`
 * - `globalThis.Headers`: Native Headers object from fetch API
 *
 */
export type Headers = TypedHeaders<RequestHeaderMap> | globalThis.Headers;
