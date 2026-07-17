export const ART_STUDIO_ERROR_CODES = [
  "ART_STUDIO_AUTHENTICATION_REQUIRED",
  "ART_STUDIO_FORBIDDEN",
  "ART_STUDIO_CAPABILITY_REQUIRED",
  "ART_STUDIO_SELF_APPROVAL_FORBIDDEN",
  "ART_STUDIO_SELF_PUBLICATION_FORBIDDEN",
  "ART_STUDIO_SELF_LIKE_FORBIDDEN",
  "ART_STUDIO_INVALID_TRANSITION",
  "ART_STUDIO_VALIDATION_FAILED",
  "ART_STUDIO_NOT_FOUND",
  "ART_STUDIO_CONFLICT",
  "ART_STUDIO_DUPLICATE_LIKE",
  "ART_STUDIO_DUPLICATE_OPEN_REPORT",
  "ART_STUDIO_REVISION_IMMUTABLE",
  "ART_STUDIO_VERSION_CONFLICT",
  "ART_STUDIO_RATE_LIMITED",
] as const;

export type ArtStudioErrorCode =
  (typeof ART_STUDIO_ERROR_CODES)[number];

export interface ArtStudioErrorEnvelope {
  error: {
    code: ArtStudioErrorCode;
    message: string;
    retryable: boolean;
    retryAfterSeconds?: number;
    details?: Readonly<Record<string, unknown>>;
  };
}

export class ArtStudioDomainError extends Error {
  readonly code: ArtStudioErrorCode;
  readonly statusCode: number;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(options: {
    code: ArtStudioErrorCode;
    message: string;
    statusCode: number;
    retryable?: boolean;
    retryAfterSeconds?: number;
    details?: Readonly<Record<string, unknown>>;
  }) {
    super(options.message);
    this.name = "ArtStudioDomainError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.details = options.details;
  }
}

export function toArtStudioErrorEnvelope(
  error: ArtStudioDomainError,
): ArtStudioErrorEnvelope {
  return {
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      ...(error.retryAfterSeconds === undefined
        ? {}
        : { retryAfterSeconds: error.retryAfterSeconds }),
      ...(error.details === undefined
        ? {}
        : { details: error.details }),
    },
  };
}
