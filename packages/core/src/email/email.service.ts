import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { Effect, Schema } from "effect";
import { AppConfig } from "../config";
import { EmailSendError } from "./email.error";
import { SendEmailInput, SendFeedbackEmailInput } from "./email.schema";

export class EmailService extends Effect.Service<EmailService>()(
  "EmailService",
  {
    effect: Effect.gen(function* () {
      return {
        sendEmail: (input: SendEmailInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(SendEmailInput)(input);
            const { awsRegion, emailSender } = yield* AppConfig;

            const sesClient = new SESv2Client({
              region: awsRegion,
            });

            const defaultFrom = emailSender;

            const command = new SendEmailCommand({
              FromEmailAddress: validated.from ?? defaultFrom,
              Destination: {
                ToAddresses: [...validated.to],
              },
              Content: {
                Simple: {
                  Subject: {
                    Data: validated.subject,
                    Charset: "UTF-8",
                  },
                  Body: {
                    Html: {
                      Data: validated.htmlBody,
                      Charset: "UTF-8",
                    },
                    ...(validated.textBody && {
                      Text: {
                        Data: validated.textBody,
                        Charset: "UTF-8",
                      },
                    }),
                  },
                },
              },
            });

            yield* Effect.tryPromise(() => sesClient.send(command)).pipe(
              Effect.mapError(
                (cause) =>
                  new EmailSendError({
                    message: "Failed to send email via SES",
                    recipient: validated.to.join(", "),
                    cause,
                  }),
              ),
            );
          }),
        sendFeedbackNotification: (input: SendFeedbackEmailInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(SendFeedbackEmailInput)(
              input,
            );

            const ratingEmoji =
              {
                positive: "😊",
                neutral: "😐",
                negative: "😞",
              }[validated.rating] ?? "❓";

            const subject = `New Feedback: ${validated.topic} (${validated.rating})`;

            const htmlBody = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  New Feedback Received ${ratingEmoji}
                </h2>

                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #374151;">Feedback Details</h3>
                  <p><strong>Topic:</strong> ${validated.topic.replace("-", " ").toUpperCase()}</p>
                  <p><strong>Rating:</strong> ${validated.rating.toUpperCase()} ${ratingEmoji}</p>
                  <p><strong>Feedback ID:</strong> <code>${validated.feedbackId}</code></p>
                  ${validated.userEmail ? `<p><strong>User Email:</strong> ${validated.userEmail}</p>` : ""}
                  ${validated.userId ? `<p><strong>User ID:</strong> ${validated.userId}</p>` : "<p><em>Anonymous feedback</em></p>"}
                </div>

                <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: #374151;">Message</h3>
                  <p style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">
                    ${validated.feedback}
                  </p>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
                  <p>This feedback was submitted through the Lax DB feedback system.</p>
                  <p>Timestamp: ${new Date().toISOString()}</p>
                </div>
              </div>
            </body>
          </html>
        `;

            const textBody = `
        New Feedback Received

        Topic: ${validated.topic.replace("-", " ").toUpperCase()}
        Rating: ${validated.rating.toUpperCase()}
        Feedback ID: ${validated.feedbackId}
        ${validated.userEmail ? `User Email: ${validated.userEmail}` : "Anonymous feedback"}

        Message:
        ${validated.feedback}

        Submitted: ${new Date().toISOString()}
        `.trim();

            // Use direct SES implementation to avoid circular dependency
            const sesClient = new SESv2Client({
              region: process.env.AWS_REGION ?? "us-west-2",
            });

            const FromEmailAddress = process.env.SENDER ?? "noreply@laxdb.io";
            const toEmailAddress =
              process.env.SUPPORT_EMAIL ?? "support@laxdb.io";

            const command = new SendEmailCommand({
              FromEmailAddress,
              Destination: {
                ToAddresses: [toEmailAddress],
              },
              Content: {
                Simple: {
                  Subject: {
                    Data: subject,
                    Charset: "UTF-8",
                  },
                  Body: {
                    Html: {
                      Data: htmlBody,
                      Charset: "UTF-8",
                    },
                    Text: {
                      Data: textBody,
                      Charset: "UTF-8",
                    },
                  },
                },
              },
            });

            yield* Effect.tryPromise(() => sesClient.send(command)).pipe(
              Effect.mapError(
                (cause) =>
                  new EmailSendError({
                    message: "Failed to send feedback notification email",
                    cause,
                  }),
              ),
            );
          }),
      } as const;
    }),
  },
) {}
