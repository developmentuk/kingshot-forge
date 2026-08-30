import type {
  IndexedPlayerRecord,
  PlayerClaimApiError,
  PlayerClaimApiResponse,
  PlayerClaimSearchResult,
} from '../types/playerClaim'
import type { PlayerAccount } from '../types/playerAccount'

async function readPayload<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T | PlayerClaimApiError | null
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload
      ? String(payload.message ?? '')
      : ''
    throw new Error(message || 'The player claim service returned an error.')
  }
  return payload as T
}

export async function searchPublicIndexedPlayer(
  playerId: string,
  kingdomId: string,
): Promise<IndexedPlayerRecord> {
  const response = await fetch('/api/player/indexed-lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, kingdomId }),
  })
  const payload = await readPayload<PlayerClaimApiResponse<IndexedPlayerRecord>>(response)
  return payload.data
}

export async function searchPlayerClaim(
  accessToken: string,
  playerId: string,
  kingdomId: string,
): Promise<PlayerClaimSearchResult> {
  const response = await fetch('/api/player/claim', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'search', playerId, kingdomId }),
  })
  const payload = await readPayload<PlayerClaimApiResponse<PlayerClaimSearchResult>>(response)
  return payload.data
}

export async function createSelfReportedClaim(
  accessToken: string,
  input: {
    playerId: string
    kingdomId: string
    playerName: string
    townCenterLevel?: string
  },
): Promise<IndexedPlayerRecord> {
  const response = await fetch('/api/player/claim', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'claim', ...input }),
  })
  const payload = await readPayload<PlayerClaimApiResponse<IndexedPlayerRecord>>(response)
  return payload.data
}


export async function linkKingshotPlayer(
  accessToken: string,
  playerId: string,
  kingdomId: string,
): Promise<PlayerAccount> {
  const response = await fetch('/api/player/account', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'link',
      playerId,
      kingdomId,
    }),
  })

  const payload = await readPayload<{
    status: 'success'
    data: PlayerAccount
  }>(response)

  if (!payload?.data) {
    throw new Error(
      'The live player link returned no player record.',
    )
  }

  return payload.data
}
