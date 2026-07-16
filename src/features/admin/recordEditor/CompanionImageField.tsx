import {
  useState,
  type ChangeEvent,
} from "react";

import {
  supabase,
} from "../../../lib/supabase";

import type {
  RecordEditorRecord,
  RecordEditorValue,
} from "./recordEditorSchema";

interface CompanionImageFieldProps {
  id: string;
  value: RecordEditorValue;
  record: RecordEditorRecord;
  disabled?: boolean;
  describedBy?: string;
  onChange: (value: RecordEditorValue) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MIN_IMAGE_SIZE = 800;
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
]);

function sanitisePathPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "record";
}

function getExtension(file: File): string {
  const fromName = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (fromName === "jpg") {
    return "jpg";
  }

  if (
    fromName === "jpeg" ||
    fromName === "png" ||
    fromName === "webp"
  ) {
    return fromName;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

async function readImageSize(
  file: File,
): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    const dimensions = await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) => {
      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };

      image.onerror = () => {
        reject(
          new Error(
            "The selected file could not be read as an image.",
          ),
        );
      };

      image.src = objectUrl;
    });

    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function CompanionImageField({
  id,
  value,
  record,
  disabled = false,
  describedBy,
  onChange,
}: CompanionImageFieldProps) {
  const [isUploading, setIsUploading] =
    useState(false);
  const [uploadError, setUploadError] =
    useState<string | null>(null);
  const [uploadMessage, setUploadMessage] =
    useState<string | null>(null);

  const imageUrl =
    typeof value === "string" ? value : "";

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadError(null);
    setUploadMessage(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setUploadError(
        "Choose a WebP, PNG or JPEG image.",
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        "The image is larger than the 2 MB upload limit.",
      );
      return;
    }

    setIsUploading(true);

    try {
      const { width, height } =
        await readImageSize(file);

      if (
        width < MIN_IMAGE_SIZE ||
        height < MIN_IMAGE_SIZE
      ) {
        throw new Error(
          `The image is ${width} × ${height} px. Use at least 800 × 800 px.`,
        );
      }

      const recordSlug = sanitisePathPart(
        String(
          record.values.slug ?? record.id,
        ),
      );
      const extension = getExtension(file);
      const objectPath = [
        "heroes",
        recordSlug,
        `portrait-${Date.now()}.${extension}`,
      ].join("/");

      const { error } = await supabase.storage
        .from("companion-images")
        .upload(objectPath, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        throw new Error(
          `Unable to upload the image: ${error.message}`,
        );
      }

      const { data } = supabase.storage
        .from("companion-images")
        .getPublicUrl(objectPath);

      onChange(data.publicUrl);
      setUploadMessage(
        `Uploaded ${width} × ${height} px. Save the draft to attach it to this hero.`,
      );
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "The image could not be uploaded.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="record-editor-image-field">
      <div className="record-editor-image-field__preview">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Current hero portrait preview"
          />
        ) : (
          <span aria-hidden="true">⚔️</span>
        )}
      </div>

      <div className="record-editor-image-field__controls">
        <label
          htmlFor={id}
          className="record-editor-button record-editor-button--secondary"
          aria-disabled={disabled || isUploading}
        >
          {isUploading
            ? "Uploading…"
            : imageUrl
              ? "Replace portrait"
              : "Upload portrait"}
        </label>

        <input
          id={id}
          className="record-editor-image-field__input"
          type="file"
          accept="image/webp,image/png,image/jpeg"
          disabled={disabled || isUploading}
          aria-describedby={describedBy}
          onChange={(event) =>
            void handleFileChange(event)
          }
        />

        {imageUrl && (
          <button
            type="button"
            className="record-editor-button record-editor-button--secondary"
            disabled={disabled || isUploading}
            onClick={() => {
              setUploadError(null);
              setUploadMessage(null);
              onChange("");
            }}
          >
            Remove portrait
          </button>
        )}
      </div>

      <p className="record-editor-image-field__requirements">
        Recommended 1200 × 1200 px. Minimum 800 × 800 px.
        WebP preferred; PNG and JPEG supported. Maximum 2 MB.
      </p>

      {uploadMessage && (
        <p
          className="record-editor-image-field__message"
          role="status"
        >
          {uploadMessage}
        </p>
      )}

      {uploadError && (
        <p
          className="record-editor-field-error"
          role="alert"
        >
          {uploadError}
        </p>
      )}

      {imageUrl && (
        <details className="record-editor-image-field__url">
          <summary>Image URL</summary>
          <code>{imageUrl}</code>
        </details>
      )}
    </div>
  );
}
