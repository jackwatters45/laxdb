import { Config, Context, Effect, Layer } from "effect";

import { EmailDeliveryError } from "./email.error";

export type SendEmailInput = {
  readonly to: readonly string[];
  readonly subject: string;
  readonly html: string;
  readonly text: string;
};

export type SendEmailResult = {
  readonly delivered: boolean;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Outbound email via the Resend HTTP API (fetch-based, Workers-friendly).
 * Without RESEND_API_KEY configured the service logs the message instead of
 * sending — local dev and preview stages stay side-effect free.
 */
export class EmailService extends Context.Service<EmailService>()(
  "EmailService",
  {
    make: Effect.gen(function* () {
      const apiKey = yield* Config.string("RESEND_API_KEY").pipe(
        Config.withDefault(""),
        Effect.orElseSucceed(() => ""),
      );
      const sender = yield* Config.string("EMAIL_SENDER").pipe(
        Config.withDefault("Malvern Lacrosse <noreply@laxdb.io>"),
        Effect.orElseSucceed(() => "Malvern Lacrosse <noreply@laxdb.io>"),
      );

      const send = (input: SendEmailInput) =>
        Effect.gen(function* () {
          if (input.to.length === 0) {
            return { delivered: false } satisfies SendEmailResult;
          }

          if (apiKey === "") {
            yield* Effect.log(
              `[email:dev] to=${input.to.join(",")} subject=${input.subject}\n${input.text}`,
            );
            return { delivered: false } satisfies SendEmailResult;
          }

          const response = yield* Effect.tryPromise({
            try: () =>
              fetch(RESEND_ENDPOINT, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: sender,
                  to: input.to,
                  subject: input.subject,
                  html: input.html,
                  text: input.text,
                }),
              }),
            catch: (cause) =>
              new EmailDeliveryError({
                message: "Email request failed",
                cause,
              }),
          });

          if (!response.ok) {
            const body = yield* Effect.tryPromise({
              try: () => response.text(),
              catch: () =>
                new EmailDeliveryError({
                  message: `Email provider returned ${response.status}`,
                }),
            });
            return yield* Effect.fail(
              new EmailDeliveryError({
                message: `Email provider returned ${response.status}: ${body}`,
                code: response.status,
              }),
            );
          }

          return { delivered: true } satisfies SendEmailResult;
        }).pipe(
          Effect.tapError((e) => Effect.logError("Failed to send email", e)),
        );

      return { send };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
