import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, Paperclip, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feedback")({
  component: FeedbackPage,
});

interface FileWithPreview extends File {
  preview: string;
}

const MAX_FILES = 3;
const MAX_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
};

function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeFile = useCallback((name: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.name === name);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f.name !== name);
    });
  }, []);

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    setError(null);
    if (rejected.length > 0) {
      const reasons = rejected
        .flatMap((r) => r.errors)
        .map((e) => e.message)
        .filter((msg, i, arr) => arr.indexOf(msg) === i);
      setError(reasons.join(". "));
    }
    const withPreviews = accepted.map(
      (file) => Object.assign(file, { preview: URL.createObjectURL(file) }) as FileWithPreview,
    );
    setFiles((prev) => [...prev, ...withPreviews].slice(0, MAX_FILES));
  }, []);

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        URL.revokeObjectURL(file.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES - files.length,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  function handleSubmit() {
    setSubmitted(true);
    setMessage("");
    setFiles((prev) => {
      for (const f of prev) URL.revokeObjectURL(f.preview);
      return [];
    });
    setError(null);
  }

  const canSubmit = message.trim().length > 0;

  if (submitted) {
    return (
      <main className="mx-auto max-w-screen-sm px-4 py-24 md:py-40">
        <div className="text-center">
          <h1 className="font-serif text-3xl text-foreground italic md:text-4xl">
            Thanks for reaching out
          </h1>
          <p className="mt-4 text-muted-foreground">
            We&rsquo;ll get back to you as soon as we can.
          </p>
          <button
            className="mt-8 inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
            onClick={() => {
              setSubmitted(false);
            }}
            type="button"
          >
            Send another message
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <header className="mb-10">
        <h1 className="font-serif text-3xl text-foreground italic md:text-4xl">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">
          Bug report, feature request, or just want to say hi &mdash; we&rsquo;d love to hear from
          you.
        </p>
      </header>

      {/* The entire card is the drop target */}
      <div
        {...getRootProps()}
        className="relative overflow-hidden rounded-xl border border-foreground/10"
      >
        <input {...getInputProps()} />

        {/* Drag overlay -- sits on top of card content, same dimensions */}
        {isDragActive && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-foreground/25 bg-background/90 backdrop-blur-xs">
            <CloudUpload className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Drop files here&hellip;</p>
            <p className="text-xs text-muted-foreground/50">
              PNG, JPG, WebP, MP4, or MOV. Max 10 MB each.
            </p>
          </div>
        )}

        {/* Card header */}
        <div className="border-b border-foreground/10 px-6 py-4">
          <span className="text-sm font-medium text-foreground">Send a message</span>
        </div>

        {/* Card body */}
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground" htmlFor="feedback-message">
              Tell us what&rsquo;s on your mind.
            </label>
            <textarea
              className={cn(
                "min-h-[120px] w-full rounded-lg border border-foreground/10 bg-transparent px-3.5 py-2.5 text-[15px] leading-relaxed text-foreground transition-colors outline-none",
                "placeholder:text-muted-foreground/60",
                "focus:border-foreground/25 focus:ring-2 focus:ring-foreground/5",
                "[field-sizing:fixed]",
              )}
              id="feedback-message"
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              placeholder="How do I..."
              rows={4}
              value={message}
            />
          </div>

          {/* Click-to-browse trigger */}
          {files.length < MAX_FILES && (
            <button
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Paperclip className="size-3.5" />
              Attach images or videos
            </button>
          )}
          {/* Hidden file input for click-to-browse */}
          <input
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime"
            className="hidden"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                onDrop(Array.from(e.target.files), []);
                e.target.value = "";
              }
            }}
            type="file"
          />

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

          {/* File previews */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <div
                  className="group relative size-16 overflow-hidden rounded-md border border-foreground/10 bg-muted"
                  key={file.name}
                >
                  {file.type.startsWith("image/") ? (
                    <img alt={file.name} className="size-full object-cover" src={file.preview} />
                  ) : (
                    <video
                      className="size-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                      src={file.preview}
                    />
                  )}
                  <button
                    aria-label={`Remove ${file.name}`}
                    className="absolute top-1 right-1 hidden rounded-full bg-background/80 p-0.5 text-foreground backdrop-blur-sm transition-colors group-hover:block hover:bg-background"
                    onClick={() => {
                      removeFile(file.name);
                    }}
                    type="button"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Screen reader */}
          <div aria-live="polite" className="sr-only">
            {files.length > 0 && `${files.length} file${files.length > 1 ? "s" : ""} attached.`}
          </div>
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-between border-t border-foreground/10 px-6 py-4">
          <span className="text-sm text-muted-foreground">
            or email us at{" "}
            <a
              className="text-foreground underline decoration-foreground/20 underline-offset-4 transition-colors hover:decoration-foreground"
              href="mailto:support@laxdb.io"
            >
              support@laxdb.io
            </a>
          </span>

          <button
            className="inline-flex cursor-pointer items-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canSubmit}
            onClick={handleSubmit}
            type="button"
          >
            Send message
          </button>
        </div>
      </div>
    </main>
  );
}
