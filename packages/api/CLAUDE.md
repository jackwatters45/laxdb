# @laxdb/api - Effect HTTP API

> **When to read:** Adding/modifying API endpoints, generated clients, HTTP routes.

Effect-based API using `HttpApi` for schema-first server handlers and a generated `HttpApiClient`.

## ADDING AN ENDPOINT

1. Define request/response schemas in `@laxdb/core/{domain}/{domain}.contract.ts`
2. Add route in `{domain}.api.ts` and register it in `definition.ts`
3. Implement handler in `{domain}.handlers.ts`
4. Register the handler layer in `groups/index.ts`
5. Consume via `ApiClient` from `@laxdb/api/client`

## CLIENT SHAPE

`ApiClient` is generated from `LaxdbApi`. Calls are grouped by `HttpApiGroup` name:

```ts
const client = yield* ApiClient;
const drills = yield* client.Drills.listDrills();
const drill = yield* client.Drills.getDrill({ payload: { publicId } });
```

Do not hand-write fetch wrappers for API routes; derive from `HttpApiClient.make(LaxdbApi)` so request/response types stay tied to the server definition.
