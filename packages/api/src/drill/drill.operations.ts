import { DrillContract } from "@laxdb/core/drill/drill.contract";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";

export const DrillHttpErrors = [
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
] as const;

export const DrillOperations = {
  list: {
    rpcName: "DrillList",
    httpName: "listDrills",
    path: "/api/drills",
    contract: DrillContract.list,
  },
  get: {
    rpcName: "DrillGet",
    httpName: "getDrill",
    path: "/api/drills/get",
    contract: DrillContract.get,
  },
  create: {
    rpcName: "DrillCreate",
    httpName: "createDrill",
    path: "/api/drills/create",
    contract: DrillContract.create,
  },
  update: {
    rpcName: "DrillUpdate",
    httpName: "updateDrill",
    path: "/api/drills/update",
    contract: DrillContract.update,
  },
  delete: {
    rpcName: "DrillDelete",
    httpName: "deleteDrill",
    path: "/api/drills/delete",
    contract: DrillContract.delete,
  },
} as const;

export const DrillRpcNames = Object.values(DrillOperations).map(
  (operation) => operation.rpcName,
);
