import type { Session } from '@supabase/supabase-js'

type FetchImplementation = typeof fetch

export type PostSignInPlayerSyncResult =
  | 'updated'
  | 'no-linked-player'
  | 'unavailable'

const signInSyncInFlight = new Map<
  string,
  Promise<PostSignInPlayerSyncResult>
>()
const signInSyncAttemptMarker = new Map<string, string>()

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

async function performLinkedPlayerSignInSync(
  session: Session,
  fetchImplementation: FetchImplementation = fetch,
): Promise<PostSignInPlayerSyncResult> {
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

  signInSyncAttemptMarker.set(userId, sessionSignInMarker(session))

  const existing = signInSyncInFlight.get(userId)
  if (existing) return existing

  const request = performLinkedPlayerSignInSync(
    session,
    fetchImplementation,
  ).finally(() => {
    if (signInSyncInFlight.get(userId) === request) {
      signInSyncInFlight.delete(userId)
    }
  })

  signInSyncInFlight.set(userId, request)
  return request
}
