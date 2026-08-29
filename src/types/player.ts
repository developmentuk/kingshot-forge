export type NormalizedPlayerLookup = {
  playerId: string
  name: string
  kingdomId: number
  townCenterLevel: number | null
  avatarUrl: string | null
  provider: 'mightpulse'
  providerFetchedAt: string
}
