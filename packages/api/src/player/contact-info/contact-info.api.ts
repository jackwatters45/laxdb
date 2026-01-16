import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { ContactInfoContract } from "@laxdb/core/player/contact-info/contact-info.contract";

// Group definition - no LaxdbApi import
export const ContactInfoGroup = HttpApiGroup.make("ContactInfo").add(
  HttpApiEndpoint.post("getPlayerWithContactInfo", "/api/contact-info/player")
    .addSuccess(ContactInfoContract.getPlayerWithContactInfo.success)
    .addError(NotFoundError)
    .addError(ValidationError)
    .addError(DatabaseError)
    .addError(ConstraintViolationError)
    .setPayload(ContactInfoContract.getPlayerWithContactInfo.payload),
);
