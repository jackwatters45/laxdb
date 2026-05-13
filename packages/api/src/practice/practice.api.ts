import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { PracticeHttpErrors, PracticeOperations } from "./practice.operations";

export const PracticesGroup = HttpApiGroup.make("Practices")
  // Practice CRUD
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.list.httpName,
      PracticeOperations.list.path,
      {
        success: PracticeOperations.list.contract.success,
        error: PracticeHttpErrors,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.get.httpName,
      PracticeOperations.get.path,
      {
        success: PracticeOperations.get.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.get.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.loadAggregate.httpName,
      PracticeOperations.loadAggregate.path,
      {
        success: PracticeOperations.loadAggregate.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.loadAggregate.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.saveAggregate.httpName,
      PracticeOperations.saveAggregate.path,
      {
        success: PracticeOperations.saveAggregate.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.saveAggregate.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.create.httpName,
      PracticeOperations.create.path,
      {
        success: PracticeOperations.create.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.create.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.update.httpName,
      PracticeOperations.update.path,
      {
        success: PracticeOperations.update.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.update.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.delete.httpName,
      PracticeOperations.delete.path,
      {
        success: PracticeOperations.delete.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.delete.contract.payload,
      },
    ),
  )

  // Practice items
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.listItems.httpName,
      PracticeOperations.listItems.path,
      {
        success: PracticeOperations.listItems.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.listItems.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.addItem.httpName,
      PracticeOperations.addItem.path,
      {
        success: PracticeOperations.addItem.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.addItem.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.updateItem.httpName,
      PracticeOperations.updateItem.path,
      {
        success: PracticeOperations.updateItem.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.updateItem.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.removeItem.httpName,
      PracticeOperations.removeItem.path,
      {
        success: PracticeOperations.removeItem.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.removeItem.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.reorderItems.httpName,
      PracticeOperations.reorderItems.path,
      {
        success: PracticeOperations.reorderItems.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.reorderItems.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.listEdges.httpName,
      PracticeOperations.listEdges.path,
      {
        success: PracticeOperations.listEdges.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.listEdges.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.replaceEdges.httpName,
      PracticeOperations.replaceEdges.path,
      {
        success: PracticeOperations.replaceEdges.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.replaceEdges.contract.payload,
      },
    ),
  )

  // Practice review
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.getReview.httpName,
      PracticeOperations.getReview.path,
      {
        success: PracticeOperations.getReview.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.getReview.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.createReview.httpName,
      PracticeOperations.createReview.path,
      {
        success: PracticeOperations.createReview.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.createReview.contract.payload,
      },
    ),
  )
  .add(
    HttpApiEndpoint.post(
      PracticeOperations.updateReview.httpName,
      PracticeOperations.updateReview.path,
      {
        success: PracticeOperations.updateReview.contract.success,
        error: PracticeHttpErrors,
        payload: PracticeOperations.updateReview.contract.payload,
      },
    ),
  );
