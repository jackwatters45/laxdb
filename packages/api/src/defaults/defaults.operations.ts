import { DefaultsContract } from "@laxdb/core/defaults/defaults.contract";

export const DefaultsOperations = {
  getNamespace: {
    rpcName: "DefaultsGetNamespace",
    contract: DefaultsContract.getNamespace,
  },
  patchNamespace: {
    rpcName: "DefaultsPatchNamespace",
    contract: DefaultsContract.patchNamespace,
  },
} as const;

export const DefaultsRpcNames = Object.values(DefaultsOperations).map(
  (operation) => operation.rpcName,
);
