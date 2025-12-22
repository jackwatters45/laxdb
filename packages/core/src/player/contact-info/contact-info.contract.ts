import { Schema } from 'effect';
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../../error';
import {
  GetPlayerContactInfoInput,
  PlayerWithContactInfo,
} from './contact-info.schema';

export const ContactInfoErrors = Schema.Union(
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError
);

export const ContactInfoContract = {
  getPlayerWithContactInfo: {
    success: Schema.NullOr(PlayerWithContactInfo),
    error: ContactInfoErrors,
    payload: GetPlayerContactInfoInput,
  },
} as const;
