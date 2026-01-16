import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { SeasonContract } from "@laxdb/core/season/season.contract";

// Group definition - no HttpApi.make or LaxdbApi import
export const SeasonsGroup = HttpApiGroup.make("Seasons")
  .add(
    HttpApiEndpoint.post("listSeasons", "/api/seasons")
      .addSuccess(SeasonContract.list.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(SeasonContract.list.payload),
  )
  .add(
    HttpApiEndpoint.post("getSeason", "/api/seasons/get")
      .addSuccess(SeasonContract.get.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(SeasonContract.get.payload),
  )
  .add(
    HttpApiEndpoint.post("createSeason", "/api/seasons/create")
      .addSuccess(SeasonContract.create.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(SeasonContract.create.payload),
  )
  .add(
    HttpApiEndpoint.post("updateSeason", "/api/seasons/update")
      .addSuccess(SeasonContract.update.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(SeasonContract.update.payload),
  )
  .add(
    HttpApiEndpoint.post("deleteSeason", "/api/seasons/delete")
      .addSuccess(SeasonContract.delete.success)
      .addError(NotFoundError)
      .addError(ValidationError)
      .addError(DatabaseError)
      .addError(ConstraintViolationError)
      .setPayload(SeasonContract.delete.payload),
  );

