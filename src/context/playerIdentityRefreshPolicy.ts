export const PLAYER_IDENTITY_REFRESH_COOLDOWN_MS = 5 * 60 * 1000

export type PlayerIdentityRefreshReason = 'automatic' | 'manual'

export type PlayerIdentityRefreshFailure = Error & {
  statusCode?: number
  code?: string
}

export function isPlayerIdentityAutoRefreshRoute(pathname: string) {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  return normalizedPath === '/'
    || normalizedPath === '/settings'
    || normalizedPath === '/transfer-profile'
    || normalizedPath === '/transfer-hub'
    || normalizedPath === '/my-forge'
    || normalizedPath.startsWith('/my-forge/')
    || normalizedPath.startsWith('/alliances/')
}

export function isTransientPlayerIdentityFailure(error: unknown) {
  const statusCode = (error as PlayerIdentityRefreshFailure | null)?.statusCode
  return statusCode === 429 || statusCode === 502 || statusCode === 503 || statusCode === 504
}

export class PlayerIdentityRefreshCoordinator {
  private readonly refreshInFlight = new Map<string, Promise<void>>()
  private readonly failureAt = new Map<string, number>()

  shouldAttempt(
    userId: string,
    reason: PlayerIdentityRefreshReason,
    now = Date.now(),
  ) {
    if (reason === 'manual') return true
    const failedAt = this.failureAt.get(userId)
    return failedAt === undefined || now - failedAt >= PLAYER_IDENTITY_REFRESH_COOLDOWN_MS
  }

  isCoolingDown(userId: string, now = Date.now()) {
    const failedAt = this.failureAt.get(userId)
    return failedAt !== undefined && now - failedAt < PLAYER_IDENTITY_REFRESH_COOLDOWN_MS
  }

  markFailure(userId: string, now = Date.now()) {
    this.failureAt.set(userId, now)
  }

  markSuccess(userId: string) {
    this.failureAt.delete(userId)
  }

  async run(
    userId: string,
    reason: PlayerIdentityRefreshReason,
    operation: () => Promise<void>,
    now = Date.now(),
  ) {
    const existing = this.refreshInFlight.get(userId)
    if (existing) {
      await existing
      return true
    }

    if (!this.shouldAttempt(userId, reason, now)) return false

    const request = operation()
      .then(() => this.markSuccess(userId))
      .catch((error: unknown) => {
        if (isTransientPlayerIdentityFailure(error)) this.markFailure(userId, now)
        throw error
      })
      .finally(() => this.refreshInFlight.delete(userId))

    this.refreshInFlight.set(userId, request)
    await request
    return true
  }
}
