export const COMMUNITY_ART_SUBMISSION_LIMIT = 5
export const COMMUNITY_ART_SUBMISSION_WINDOW_SECONDS = 3_600

export function calculateSubmissionRetryAfterSeconds(oldestCreatedAt: string, nowMs = Date.now(), windowSeconds = COMMUNITY_ART_SUBMISSION_WINDOW_SECONDS): number {
  const oldestMs = Date.parse(oldestCreatedAt)
  if (!Number.isFinite(oldestMs)) return windowSeconds
  return Math.max(1, Math.ceil((oldestMs + windowSeconds * 1000 - nowMs) / 1000))
}
