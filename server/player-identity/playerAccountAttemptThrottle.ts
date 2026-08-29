import { LinkedPlayerServiceError } from './linkedPlayerService.js'

export const PLAYER_ACCOUNT_ATTEMPT_WINDOW_MS = 5 * 60 * 1000
export const PLAYER_ACCOUNT_ATTEMPT_LIMIT = 20

type AttemptRecord = { count: number; resetAt: number }

export class PlayerAccountAttemptThrottle {
  private readonly attempts = new Map<string, AttemptRecord>()

  constructor(
    private readonly limit = PLAYER_ACCOUNT_ATTEMPT_LIMIT,
    private readonly windowMs = PLAYER_ACCOUNT_ATTEMPT_WINDOW_MS,
  ) {}

  enforce(userId: string, nowMs = Date.now()): void {
    const current = this.attempts.get(userId)
    if (!current || current.resetAt <= nowMs) {
      this.attempts.set(userId, { count: 1, resetAt: nowMs + this.windowMs })
      return
    }
    if (current.count >= this.limit) {
      throw new LinkedPlayerServiceError(
        429,
        'Too many player account requests. Try again in a few minutes.',
        'PLAYER_ACCOUNT_RATE_LIMITED',
        true,
      )
    }
    current.count += 1
  }
}
