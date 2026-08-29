export type PlayerProviderName = 'mightpulse'

export type NormalizedPlayer = Readonly<{
  playerId: string
  name: string
  kingdomId: number
  townCenterLevel: number | null
  avatarUrl: string | null
  provider: PlayerProviderName
  providerFetchedAt: string
}>

export type PlayerLookupRequest = Readonly<{
  playerId: string
  expectedKingdomId?: number
}>

export interface PlayerProvider {
  lookupPlayer(request: PlayerLookupRequest): Promise<NormalizedPlayer>
}

export class PlayerProviderError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly retryable = false,
  ) {
    super(message)
    this.name = 'PlayerProviderError'
  }
}
