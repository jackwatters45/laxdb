export const MAX_FEEDBACK_FILES = 3;
export const MAX_FEEDBACK_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FEEDBACK_MESSAGE_LENGTH = 5_000;

export const FEEDBACK_ACCEPTED_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
} as const;

export const FEEDBACK_ACCEPTED_MIME_TYPES = new Set(
  Object.keys(FEEDBACK_ACCEPTED_TYPES),
);

export interface FeedbackAttachmentRecord {
  readonly key: string;
  readonly name: string;
  readonly contentType: string;
  readonly size: number;
}

export interface FeedbackSubmissionRecord {
  readonly id: string;
  readonly message: string;
  readonly createdAt: string;
  readonly attachmentCount: number;
  readonly attachments: readonly FeedbackAttachmentRecord[];
}
