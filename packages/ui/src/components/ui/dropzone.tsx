"use client";

import { cn } from "@laxdb/ui/lib/utils";
import { CloudUpload, X } from "lucide-react";
import * as React from "react";
import { useDropzone, type DropzoneOptions, type FileRejection } from "react-dropzone";

interface FileWithPreview extends File {
  preview: string;
}

interface DropzoneProps extends Omit<DropzoneOptions, "onDrop"> {
  value?: FileWithPreview[];
  onChange?: (files: FileWithPreview[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  className?: string;
  label?: string;
  description?: string;
}

function Dropzone({
  value = [],
  onChange,
  onReject,
  className,
  label = "Drop files here or click to browse",
  description,
  maxFiles = 3,
  ...dropzoneOptions
}: DropzoneProps) {
  const onDrop = React.useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      const withPreviews = accepted.map(
        (file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          }) as FileWithPreview,
      );

      const next = [...value, ...withPreviews].slice(0, maxFiles);
      onChange?.(next);

      if (rejected.length > 0) {
        onReject?.(rejected);
      }
    },
    [value, onChange, onReject, maxFiles],
  );

  const removeFile = React.useCallback(
    (name: string) => {
      const removed = value.find((f) => f.name === name);
      if (removed) URL.revokeObjectURL(removed.preview);
      onChange?.(value.filter((f) => f.name !== name));
    },
    [value, onChange],
  );

  React.useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      value.forEach((file) => URL.revokeObjectURL(file.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDisabled = value.length >= maxFiles;

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    maxFiles: maxFiles - value.length,
    disabled: isDisabled,
    ...dropzoneOptions,
  });

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        {...getRootProps()}
        role="button"
        aria-label="Upload attachments"
        aria-disabled={isDisabled}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-all",
          "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragAccept && "border-foreground/30 bg-foreground/5",
          isDragReject && "border-destructive/50 bg-destructive/5",
          !isDragActive &&
            "border-foreground/15 hover:border-foreground/25 hover:bg-foreground/[0.02]",
          isDisabled && "pointer-events-none opacity-40",
        )}
      >
        <input {...getInputProps()} />
        <CloudUpload
          className={cn(
            "size-8 transition-colors",
            isDragActive ? "text-foreground/60" : "text-muted-foreground/60",
          )}
        />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {isDragActive ? "Drop files here\u2026" : label}
          </p>
          {description && !isDragActive && (
            <p className="text-xs text-muted-foreground/60">{description}</p>
          )}
        </div>
      </div>

      {/* Previews */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((file) => (
            <div
              key={file.name}
              className="group relative size-16 overflow-hidden rounded-md border border-foreground/10 bg-muted"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="size-full object-cover"
                  onLoad={() => URL.revokeObjectURL(file.preview)}
                />
              ) : file.type.startsWith("video/") ? (
                <video
                  src={file.preview}
                  className="size-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                  {file.name.split(".").pop()?.toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.name);
                }}
                aria-label={`Remove ${file.name}`}
                className="absolute top-1 right-1 hidden rounded-full bg-background/80 p-0.5 text-foreground backdrop-blur-sm transition-colors group-hover:block hover:bg-background"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Screen reader announcement */}
      <div aria-live="polite" className="sr-only">
        {value.length > 0 && `${value.length} file${value.length > 1 ? "s" : ""} attached.`}
      </div>
    </div>
  );
}

export { Dropzone, type DropzoneProps, type FileWithPreview };
