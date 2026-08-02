import type { PlayerInfoErrorResponse } from '../types/player'
import type {
  OfficialPlayerChallengeResponse,
  OfficialPlayerLookupResponse,
} from '../types/officialPlayerLookup'

async function postLookup<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/player/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null) as T | PlayerInfoErrorResponse | null
  if (!response.ok) {
    const errorPayload = payload as PlayerInfoErrorResponse | null
    throw new Error(errorPayload?.message || 'Player information could not be loaded.')
  }
  if (!payload || (payload as { status?: string }).status !== 'success') {
    throw new Error('The official player service returned an unexpected response.')
  }
  return payload as T
}

export function startOfficialPlayerLookup(playerId: string, kingdomId: string) {
  return postLookup<OfficialPlayerChallengeResponse>({
    action: 'challenge',
    playerId,
    kingdomId,
  })
}

export function completeOfficialPlayerLookup(challengeToken: string, captchaCode: string) {
  return postLookup<OfficialPlayerLookupResponse>({
    action: 'complete',
    challengeToken,
    captchaCode,
  })
}
