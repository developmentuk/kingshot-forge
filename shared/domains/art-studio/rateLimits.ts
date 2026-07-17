import type {
  ArtStudioActor,
} from "./types.js";

export const ART_STUDIO_RATE_LIMIT_POLICIES = {
  create_submission: { limit: 5, windowSeconds: 3_600 },
  update_submission: { limit: 30, windowSeconds: 3_600 },
  like: { limit: 60, windowSeconds: 60 },
  report: { limit: 5, windowSeconds: 86_400 },
  report_rendering_issue: { limit: 10, windowSeconds: 3_600 },
  moderate: { limit: 60, windowSeconds: 3_600 },
} as const;

export type ArtStudioRateLimitAction =
  keyof typeof ART_STUDIO_RATE_LIMIT_POLICIES;

export interface ArtStudioRateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  retryAfterSeconds?: number;
}

export interface ArtStudioRateLimiter {
  check(input: {
    actor: ArtStudioActor;
    action: ArtStudioRateLimitAction;
    resourceId?: string;
  }): Promise<ArtStudioRateLimitDecision>;
}
