# @laxdb/api - Effect RPC API

> **When to read:** Adding/modifying API endpoints, RPC handlers, HTTP routes.

Effect-based API using `HttpApi` + `RpcGroup` for type-safe client-server communication.

## ADDING AN ENDPOINT

1. Define RPC request/response in `{domain}.rpc.ts`
2. Implement handler in `{domain}.handlers.ts`
3. Add client method in `{domain}.client.ts`
4. If REST, add route in `{domain}.api.ts` and register in `definition.ts`
5. Register RPC in `rpc-group.ts` and handler in `rpc-handlers.ts`
