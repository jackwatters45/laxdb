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

export type EmailConfig = {
  readonly apiKey: string;
  readonly sender: string;
};

export const DEFAULT_EMAIL_SENDER = "Malvern Lacrosse <noreply@laxdb.io>";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Plain fetch against the Resend HTTP API (Workers-friendly). Throws on
 * non-2xx. Shared by EmailService and the Better Auth email callbacks, which
 * run outside the Effect runtime.
 */
export const sendViaResend = async (
  config: EmailConfig,
  input: SendEmailInput,
): Promise<void> => {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.sender,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Email provider returned ${response.status}: ${body}`);
  }
};

const makeService = (config: EmailConfig) => ({
  send: (input: SendEmailInput) =>
    Effect.gen(function* () {
      if (input.to.length === 0) {
        return { delivered: false } satisfies SendEmailResult;
      }

      if (config.apiKey === "") {
        yield* Effect.log(
          `[email:dev] to=${input.to.join(",")} subject=${input.subject}\n${input.text}`,
        );
        return { delivered: false } satisfies SendEmailResult;
      }

      yield* Effect.tryPromise({
        try: () => sendViaResend(config, input),
        catch: (cause) =>
          new EmailDeliveryError({
            message:
              cause instanceof Error ? cause.message : "Email request failed",
            cause,
          }),
      });

      return { delivered: true } satisfies SendEmailResult;
    }).pipe(Effect.tapError((e) => Effect.logError("Failed to send email", e))),
});

/**
 * Outbound email via Resend. Without an api key the service logs the message
 * instead of sending — local dev and preview stages stay side-effect free.
 *
 * The default layer reads RESEND_API_KEY / EMAIL_SENDER from Effect Config
 * (process.env in local dev). Deployed workers should use `layerFromConfig`
 * with values from the worker environment — see EmailLive in @laxdb/api.
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
        Config.withDefault(DEFAULT_EMAIL_SENDER),
        Effect.orElseSucceed(() => DEFAULT_EMAIL_SENDER),
      );
      return makeService({ apiKey, sender });
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);

  static readonly layerFromConfig = (config: EmailConfig) =>
    Layer.succeed(this, makeService(config));
}
