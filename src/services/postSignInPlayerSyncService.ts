import type { Session } from '@supabase/supabase-js'

type FetchImplementation = typeof fetch

export type PostSignInPlayerSyncResult =
  | 'updated'
  | 'no-linked-player'
  | 'already-attempted'
  | 'unavailable'

const signInSyncInFlight = new Map<
  string,
  Promise<PostSignInPlayerSyncResult>
>()
const signInSyncAttemptMarker = new Map<string, string>()
const signInSyncOutcome = new Map<
  string,
  Readonly<{
    marker: string
    result: Exclude<PostSignInPlayerSyncResult, 'already-attempted'>
  }>
>()

function sessionSignInMarker(session: Session): string {
  return session.user?.last_sign_in_at
    ?? String(session.expires_at ?? '')
}

export function hasPostSignInPlayerSyncAttempted(
  session: Session,
): boolean {
  const userId = session.user?.id
  if (!userId) return false
  return signInSyncAttemptMarker.get(userId) === sessionSignInMarker(session)
}

export function getPostSignInPlayerSyncInFlight(
  userId: string,
): Promise<PostSignInPlayerSyncResult> | null {
  return signInSyncInFlight.get(userId) ?? null
}

export function getPostSignInPlayerSyncOutcome(
  session: Session,
): Exclude<PostSignInPlayerSyncResult, 'already-attempted'> | null {
  const userId = session.user?.id
  if (!userId) return null

  const outcome = signInSyncOutcome.get(userId)
  if (!outcome || outcome.marker !== sessionSignInMarker(session)) {
    return null
  }
  return outcome.result
}

export function shouldSuppressAutomaticRefreshAfterPostSignInSync(
  result: PostSignInPlayerSyncResult | null,
): boolean {
  return result === 'updated' || result === 'no-linked-player'
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
  const userId = session.user?.id
  if (!userId) return 'unavailable'

  const marker = sessionSignInMarker(session)
  const existing = signInSyncInFlight.get(userId)
  if (existing) return existing

  if (signInSyncAttemptMarker.get(userId) === marker) {
    return 'already-attempted'
  }

  signInSyncAttemptMarker.set(userId, marker)

  const request = performLinkedPlayerSignInSync(
    session,
    fetchImplementation,
  ).then((result) => {
    signInSyncOutcome.set(userId, {
      marker,
      result,
    })
    return result
  }).finally(() => {
    if (signInSyncInFlight.get(userId) === request) {
      signInSyncInFlight.delete(userId)
    }
  })

  signInSyncInFlight.set(userId, request)
  return request
}
