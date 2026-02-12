import { Effect } from "effect";

import { EmailService } from "../email/email.service";
import { decodeArguments, parsePostgresError } from "../util";

import { FeedbackRepo } from "./feedback.repo";
import { CreateFeedbackInput } from "./feedback.schema";

export class FeedbackService extends Effect.Service<FeedbackService>()(
  "FeedbackService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* FeedbackRepo;
      const emailService = yield* EmailService;

      return {
        create: (input: CreateFeedbackInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreateFeedbackInput, input);
            const feedback = yield* repo.insert(decoded);

            yield* emailService
              .sendFeedbackNotification({
                feedbackId: feedback.publicId,
                feedback: feedback.feedback,
                source: feedback.source,
                attachmentCount: feedback.attachments?.length ?? 0,
                userEmail: feedback.userEmail ?? undefined,
                userId: feedback.userId ?? undefined,
              })
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.catchAll(() => Effect.void),
                Effect.forkDaemon,
              );

            return feedback;
          }).pipe(
            Effect.catchTag("SqlError", (error) =>
              Effect.fail(parsePostgresError(error)),
            ),
            Effect.tap(() => Effect.log("Feedback created")),
            Effect.tapError((error) =>
              Effect.logError("Failed to create feedback", error),
            ),
          ),
      } as const;
    }),
    dependencies: [FeedbackRepo.Default, EmailService.Default],
  },
) {}
