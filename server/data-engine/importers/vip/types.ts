export interface VipLevelSourceRecord {
  level?: unknown
  xpToReach?: unknown
  xp_to_reach?: unknown
  gemsEquivalent?: unknown
  gems_equivalent?: unknown
}

export interface VipSourcePayload {
  _meta?: unknown
  vipLevels: unknown[]
}

export interface NormalisedVipRecord {
  key: string
  level: number
  xp_to_reach: number
  gems_equivalent: number

  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}