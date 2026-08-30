import type { Session } from '@supabase/supabase-js'

type FetchImplementation = typeof fetch

export type PostSignInPlayerSyncResult =
  | 'updated'
  | 'no-linked-player'
  | 'in-progress'
  | 'already-attempted'
  | 'unavailable'

const signInSyncInFlight = new Map<
  string,
  Promise<PostSignInPlayerSyncResult>
>()
const signInSyncAttempted = new Set<string>()
const signInSyncOutcome = new Map<
  string,
  Exclude<PostSignInPlayerSyncResult, 'already-attempted'>
>()

function sessionSignInMarker(session: Session): string {
  return session.user?.last_sign_in_at
    ?? String(session.expires_at ?? '')
}

function sessionSignInKey(session: Session): string | null {
  const userId = session.user?.id
  if (!userId) return null
  return `${userId}\n${sessionSignInMarker(session)}`
}

export function hasPostSignInPlayerSyncAttempted(
  session: Session,
): boolean {
  const key = sessionSignInKey(session)
  return key !== null && signInSyncAttempted.has(key)
}

export function getPostSignInPlayerSyncInFlight(
  session: Session,
): Promise<PostSignInPlayerSyncResult> | null {
  const key = sessionSignInKey(session)
  return key === null ? null : signInSyncInFlight.get(key) ?? null
}

export function getPostSignInPlayerSyncOutcome(
  session: Session,
): Exclude<PostSignInPlayerSyncResult, 'already-attempted'> | null {
  const key = sessionSignInKey(session)
  return key === null ? null : signInSyncOutcome.get(key) ?? null
}

export function shouldSuppressAutomaticRefreshAfterPostSignInSync(
  result: PostSignInPlayerSyncResult | null,
): boolean {
  return result === 'updated'
    || result === 'no-linked-player'
}

export const POST_SIGN_IN_COMPLETION_POLL_INTERVAL_MS = 3_000
export const POST_SIGN_IN_COMPLETION_MAX_ATTEMPTS = 34

type SleepImplementation = (milliseconds: number) => Promise<void>

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

export async function waitForPostSignInPlayerSyncCompletion(
  session: Session,
  options: Readonly<{
    intervalMs?: number
    maxAttempts?: number
    sleepImplementation?: SleepImplementation
    fetchImplementation?: FetchImplementation
    shouldStop?: () => boolean
  }> = {},
): Promise<boolean> {
  const intervalMs = options.intervalMs
    ?? POST_SIGN_IN_COMPLETION_POLL_INTERVAL_MS
  const maxAttempts = options.maxAttempts
    ?? POST_SIGN_IN_COMPLETION_MAX_ATTEMPTS
  const sleepImplementation = options.sleepImplementation ?? defaultSleep
  const fetchImplementation = options.fetchImplementation ?? fetch

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (options.shouldStop?.()) return false
    if (attempt > 0) await sleepImplementation(intervalMs)
    if (options.shouldStop?.()) return false

    const result = await performLinkedPlayerSignInStatusCheck(
      session,
      fetchImplementation,
    )
    if (result === 'completed') return true
    if (result === 'unavailable') return false
  }

  return false
}

async function performLinkedPlayerSignInStatusCheck(
  session: Session,
  fetchImplementation: FetchImplementation = fetch,
): Promise<'completed' | 'in-progress' | 'unavailable'> {
  if (!session.access_token) return 'unavailable'

  try {
    const response = await fetchImplementation('/api/player/account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sign-in-status',
      }),
    })

    const payload = await response.json().catch(() => null) as {
      status?: string
      code?: string
    } | null

    if (
      response.ok
      && payload?.status === 'success'
      && payload.code === 'PLAYER_INTELLIGENCE_CACHED'
    ) {
      return 'completed'
    }

    if (
      response.ok
      && payload?.status === 'success'
      && payload.code === 'PLAYER_INTELLIGENCE_IN_PROGRESS'
    ) {
      return 'in-progress'
    }

    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}

async function performLinkedPlayerSignInSync(
  session: Session,
  fetchImplementation: FetchImplementation = fetch,
): Promise<Exclude<PostSignInPlayerSyncResult, 'already-attempted'>> {
  if (!session.access_token) return 'unavailable'

  try {
    const response = await fetchImplementation('/api/player/account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'revalidate',
        refreshReason: 'sign-in',
      }),
    })

    const payload = await response.json().catch(() => null) as {
      status?: string
      code?: string
      data?: unknown
    } | null

    if (
      response.ok
      && payload?.status === 'success'
      && payload.code === 'NO_LINKED_PLAYER'
    ) {
      return 'no-linked-player'
    }

    if (
      response.ok
      && payload?.status === 'success'
      && payload.code === 'PLAYER_INTELLIGENCE_IN_PROGRESS'
    ) {
      return 'in-progress'
    }

    if (response.ok && payload?.status === 'success') {
      return 'updated'
    }

    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}


export async function syncLinkedPlayerAfterSignIn(
  session: Session,
  fetchImplementation: FetchImplementation = fetch,
): Promise<PostSignInPlayerSyncResult> {
  const key = sessionSignInKey(session)
  if (key === null) return 'unavailable'

  const existing = signInSyncInFlight.get(key)
  if (existing) return existing

  if (signInSyncAttempted.has(key)) {
    return 'already-attempted'
  }

  signInSyncAttempted.add(key)

  const request = performLinkedPlayerSignInSync(
    session,
    fetchImplementation,
  ).then((result) => {
    signInSyncOutcome.set(key, result)
    return result
  }).finally(() => {
    if (signInSyncInFlight.get(key) === request) {
      signInSyncInFlight.delete(key)
    }
  })

  signInSyncInFlight.set(key, request)
  return request
}
