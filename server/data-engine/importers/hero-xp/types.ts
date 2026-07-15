export interface HeroXpLevelSourceRecord {
  level?: unknown
  xpToReach?: unknown
  xp_to_reach?: unknown
  deploymentCapacity?: unknown
  deployment_capacity?: unknown
}

export interface HeroXpSourcePayload {
  _meta?: unknown
  heroXp: unknown[]
}

export interface NormalisedHeroXpRecord {
  key: string
  level: number
  xp_to_reach: number
  deployment_capacity: number

  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}