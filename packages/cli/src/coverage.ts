import { ApiRpcNames } from "@laxdb/api/operation-catalog";

export const CLI_ENTRYPOINTS = [
  "defaults",
  "drill",
  "play",
  "player",
  "practice",
] as const;

// API RPC names are sourced from the operation catalog so the CLI coverage
// test checks generated RPC definitions against the same catalog used by API
// adapters.
export const CLI_RPC_COVERAGE = ApiRpcNames;
