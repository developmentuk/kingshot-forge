import type { Session } from '@supabase/supabase-js'

type FetchImplementation = typeof fetch

export type PostSignInPlayerSyncResult =
  | 'updated'
  | 'no-linked-player'
  | 'unavailable'

export async function syncLinkedPlayerAfterSignIn(
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
