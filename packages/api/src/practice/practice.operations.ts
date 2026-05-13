import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { PracticeContract } from "@laxdb/core/practice/practice.contract";

export const PracticeHttpErrors = [
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
] as const;

export const PracticeOperations = {
  list: {
    rpcName: "PracticeList",
    httpName: "listPractices",
    path: "/api/practices",
    contract: PracticeContract.list,
  },
  get: {
    rpcName: "PracticeGet",
    httpName: "getPractice",
    path: "/api/practices/get",
    contract: PracticeContract.get,
  },
  loadAggregate: {
    rpcName: "PracticeLoadAggregate",
    httpName: "loadPracticeAggregate",
    path: "/api/practices/aggregate/load",
    contract: PracticeContract.loadAggregate,
  },
  saveAggregate: {
    rpcName: "PracticeSaveAggregate",
    httpName: "savePracticeAggregate",
    path: "/api/practices/aggregate/save",
    contract: PracticeContract.saveAggregate,
  },
  create: {
    rpcName: "PracticeCreate",
    httpName: "createPractice",
    path: "/api/practices/create",
    contract: PracticeContract.create,
  },
  update: {
    rpcName: "PracticeUpdate",
    httpName: "updatePractice",
    path: "/api/practices/update",
    contract: PracticeContract.update,
  },
  delete: {
    rpcName: "PracticeDelete",
    httpName: "deletePractice",
    path: "/api/practices/delete",
    contract: PracticeContract.delete,
  },
  listItems: {
    rpcName: "PracticeListItems",
    httpName: "listPracticeItems",
    path: "/api/practices/items",
    contract: PracticeContract.listItems,
  },
  addItem: {
    rpcName: "PracticeAddItem",
    httpName: "addPracticeItem",
    path: "/api/practices/items/add",
    contract: PracticeContract.addItem,
  },
  updateItem: {
    rpcName: "PracticeUpdateItem",
    httpName: "updatePracticeItem",
    path: "/api/practices/items/update",
    contract: PracticeContract.updateItem,
  },
  removeItem: {
    rpcName: "PracticeRemoveItem",
    httpName: "removePracticeItem",
    path: "/api/practices/items/remove",
    contract: PracticeContract.removeItem,
  },
  reorderItems: {
    rpcName: "PracticeReorderItems",
    httpName: "reorderPracticeItems",
    path: "/api/practices/items/reorder",
    contract: PracticeContract.reorderItems,
  },
  listEdges: {
    rpcName: "PracticeListEdges",
    httpName: "listPracticeEdges",
    path: "/api/practices/edges",
    contract: PracticeContract.listEdges,
  },
  replaceEdges: {
    rpcName: "PracticeReplaceEdges",
    httpName: "replacePracticeEdges",
    path: "/api/practices/edges/replace",
    contract: PracticeContract.replaceEdges,
  },
  getReview: {
    rpcName: "PracticeGetReview",
    httpName: "getPracticeReview",
    path: "/api/practices/review/get",
    contract: PracticeContract.getReview,
  },
  createReview: {
    rpcName: "PracticeCreateReview",
    httpName: "createPracticeReview",
    path: "/api/practices/review/create",
    contract: PracticeContract.createReview,
  },
  updateReview: {
    rpcName: "PracticeUpdateReview",
    httpName: "updatePracticeReview",
    path: "/api/practices/review/update",
    contract: PracticeContract.updateReview,
  },
} as const;

export const PracticeRpcNames = Object.values(PracticeOperations).map(
  (operation) => operation.rpcName,
);
