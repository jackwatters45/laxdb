declare const require: (specifier: "cloudflare:workers") => {
  env: { STORAGE?: R2Bucket };
};

import {
  FEEDBACK_ACCEPTED_MIME_TYPES,
  MAX_FEEDBACK_FILES,
  MAX_FEEDBACK_FILE_SIZE,
  MAX_FEEDBACK_MESSAGE_LENGTH,
  type FeedbackAttachmentRecord,
  type FeedbackSubmissionRecord,
} from "@/lib/feedback";

const feedbackPrefix = (date: Date, id: string) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `feedback/${year}/${month}/${day}/${id}`;
};

const sanitizeFilename = (name: string) => {
  const sanitized = name
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9._-]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");

  return sanitized.length > 0 ? sanitized : "attachment";
};

const getStorage = (): R2Bucket => {
  const { env } = require("cloudflare:workers");
  const storage = env.STORAGE;

  if (storage === undefined) {
    throw new Error(
      "STORAGE binding is not configured for the marketing worker.",
    );
  }

  return storage;
};

const getFiles = (formData: FormData) => {
  const files: File[] = [];

  for (const entry of formData.getAll("files")) {
    if (entry instanceof File && entry.size > 0) {
      files.push(entry);
    }
  }

  return files;
};

const validateMessage = (formData: FormData) => {
  const rawMessage = formData.get("message");

  if (typeof rawMessage !== "string") {
    throw new TypeError("Message is required.");
  }

  const message = rawMessage.trim();

  if (message.length === 0) {
    throw new Error("Message is required.");
  }

  if (message.length > MAX_FEEDBACK_MESSAGE_LENGTH) {
    throw new Error(
      `Message must be ${MAX_FEEDBACK_MESSAGE_LENGTH} characters or less.`,
    );
  }

  return message;
};

const validateFiles = (files: readonly File[]) => {
  if (files.length > MAX_FEEDBACK_FILES) {
    throw new Error(`You can attach up to ${MAX_FEEDBACK_FILES} files.`);
  }

  for (const file of files) {
    if (!FEEDBACK_ACCEPTED_MIME_TYPES.has(file.type)) {
      throw new Error(`${file.name} is not a supported file type.`);
    }

    if (file.size > MAX_FEEDBACK_FILE_SIZE) {
      throw new Error(`${file.name} exceeds the 10 MB file size limit.`);
    }
  }
};

export async function storeFeedbackSubmission(
  formData: FormData,
): Promise<FeedbackSubmissionRecord> {
  const storage = getStorage();
  const message = validateMessage(formData);
  const files = getFiles(formData);

  validateFiles(files);

  const now = new Date();
  const id = crypto.randomUUID();
  const prefix = feedbackPrefix(now, id);

  const attachments = await Promise.all(
    files.map(async (file, index): Promise<FeedbackAttachmentRecord> => {
      const safeName = sanitizeFilename(file.name);
      const key = `${prefix}/attachments/${String(index + 1).padStart(2, "0")}-${safeName}`;

      await storage.put(key, file, {
        httpMetadata: {
          contentType: file.type,
          contentDisposition: `inline; filename="${safeName}"`,
        },
        customMetadata: {
          feedbackId: id,
          originalName: file.name,
        },
      });

      return {
        key,
        name: file.name,
        contentType: file.type,
        size: file.size,
      };
    }),
  );

  const submission: FeedbackSubmissionRecord = {
    id,
    message,
    createdAt: now.toISOString(),
    attachmentCount: attachments.length,
    attachments,
  };

  await storage.put(
    `${prefix}/submission.json`,
    JSON.stringify(submission, null, 2),
    {
      httpMetadata: {
        contentType: "application/json",
      },
      customMetadata: {
        feedbackId: id,
        kind: "feedback-submission",
      },
    },
  );

  return submission;
}
