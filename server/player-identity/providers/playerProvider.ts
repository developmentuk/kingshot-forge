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


export type PlayerAllianceIntelligence = Readonly<{
  allianceId: string | null
  tag: string
  name: string
  rank: number | null
  rankLabel: string | null
  power: number | null
  memberCount: number | null
  flagUrl: string | null
  leaderName: string | null
}>

export type PlayerBaseIntelligence = Readonly<{
  power: number | null
  vip: number | null
  x: number | null
  y: number | null
  kills: number | null
  office: string | null
  online: boolean | null
  lastActiveAt: string | null
  lastLoginAt: string | null
  language: string | null
  shieldEndsAt: string | null
  burnEndsAt: string | null
  alliance: PlayerAllianceIntelligence | null
}>

export type PlayerHeroSkillIntelligence = Readonly<{
  id: string
  level: number
}>

export type PlayerHeroGearIntelligence = Readonly<{
  equipmentId: string
  sourceId: string | null
  slot: string
  name: string
  enhancementLevel: number | null
  refineLevel: number | null
  gearLevel: number | null
  quality: string | null
  qualityKey: string | null
  qualityLabel: string | null
  red: boolean | null
  troop: string | null
  troopLabel: string | null
}>

export type PlayerHeroExclusiveAttribute = Readonly<{
  id: string
  value: number
  label: string | null
}>

export type PlayerHeroExclusiveGearIntelligence = Readonly<{
  id: string
  name: string
  level: number | null
  slot: string | null
  attackRatio: number | null
  healthRatio: number | null
  defenceRatio: number | null
  powerRatio: number | null
  strategySkillId: string | null
  pveSkillId: string | null
  strategyAttributes: ReadonlyArray<PlayerHeroExclusiveAttribute>
}>

export type PlayerHeroIntelligence = Readonly<{
  id: string
  name: string
  level: number | null
  stars: number | null
  starLabel: string | null
  quality: string | null
  power: number | null
  position: number | null
  skillLevels: ReadonlyArray<PlayerHeroSkillIntelligence>
  exclusiveGearLevel: number | null
  exclusiveGear: PlayerHeroExclusiveGearIntelligence | null
  gear: ReadonlyArray<PlayerHeroGearIntelligence>
}>

export type PlayerRanksIntelligence = Readonly<{
  power: number | null
  powerRank: number | null
  kills: number | null
  killsRank: number | null
  townCenterLevel: number | null
  townCenterRank: number | null
  mysticTrial: number | null
  mysticRank: number | null
  leaderboards: ReadonlyArray<Readonly<{
    name: string
    value: number
    kingdomRank: number | null
  }>>
}>

export type PlayerGovernorGearGemIntelligence = Readonly<{
  slot: string
  id: string
}>

export type PlayerGovernorGearItemIntelligence = Readonly<{
  slot: string
  name: string
  equipmentId: string
  quality: string | null
  tier: number | null
  star: number | null
  strengthLevel: number | null
  score: number | null
  combat: number | null
  icon: string | null
  gems: ReadonlyArray<PlayerGovernorGearGemIntelligence>
}>

export type PlayerGovernorGearIntelligence = Readonly<{
  hidden: boolean
  message: string | null
  items: ReadonlyArray<PlayerGovernorGearItemIntelligence>
}>

export type NormalizedPlayerIntelligence = Readonly<{
  identity: NormalizedPlayer
  base: PlayerBaseIntelligence
  heroes: ReadonlyArray<PlayerHeroIntelligence>
  ranks: PlayerRanksIntelligence
  governorGear: PlayerGovernorGearIntelligence
  providerCachedAt: string | null
  providerAgeSeconds: number | null
  providerFresh: boolean | null
}>

export type PlayerIntelligenceLookupRequest = PlayerLookupRequest

export interface PlayerIntelligenceProvider extends PlayerProvider {
  lookupPlayerIntelligence(
    request: PlayerIntelligenceLookupRequest,
  ): Promise<NormalizedPlayerIntelligence>
}
