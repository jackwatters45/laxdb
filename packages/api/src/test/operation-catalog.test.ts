import { describe, expect, it } from "vitest";

import { ApiRpcNames } from "../operation-catalog";
import { LaxdbRpcV2 } from "../rpc-group";

describe("API operation catalog", () => {
  it("matches the concrete RPC group", () => {
    const rpcGroupNames = [...LaxdbRpcV2.requests.keys()].toSorted((a, b) =>
      a.localeCompare(b),
    );

    expect(rpcGroupNames).toEqual(ApiRpcNames);
  });

  it("keeps RPC names sorted and unique", () => {
    expect(ApiRpcNames).toEqual(
      [...new Set(ApiRpcNames)].toSorted((a, b) => a.localeCompare(b)),
    );
  });
});
