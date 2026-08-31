export type AllianceProviderName = 'mightpulse'

export type AllianceProviderLookupRequest = Readonly<{
  kingdomId: number
  tag: string
}>

export type NormalizedAllianceInfo = Readonly<{
  providerAllianceId: string
  kingdomId: number
  tag: string
  name: string
  power: number | null
  memberCount: number | null
  leaderName: string | null
  leaderInternalUid: string | null
  leaderPlayerId: string | null
  flagUrl: string | null
  powerRank: number | null
}>

export type NormalizedAllianceRosterMember = Readonly<{
  providerInternalUid: string
  playerId: string
  providerFid: string
  name: string
  kingdomId: number
  power: number | null
  townCenterLevel: number | null
  kills: number | null
  allianceRank: number
  allianceRankLabel: string | null
  avatarUrl: string | null
  lastActiveAt: string | number | null
  online: boolean | null
}>

export type NormalizedAllianceIntelligence = Readonly<{
  provider: AllianceProviderName
  providerFetchedAt: string
  providerCachedAt: string | null
  providerAgeSeconds: number | null
  providerFresh: boolean | null
  alliance: NormalizedAllianceInfo
  members: ReadonlyArray<NormalizedAllianceRosterMember>
}>

export interface AllianceIntelligenceProvider {
  lookupAlliance(
    request: AllianceProviderLookupRequest,
  ): Promise<NormalizedAllianceIntelligence>
}

export class AllianceProviderError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly retryable = false,
  ) {
    super(message)
    this.name = 'AllianceProviderError'
  }
}
