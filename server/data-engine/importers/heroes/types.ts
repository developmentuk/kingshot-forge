export interface HeroSourceRecord {
  name?: unknown
  slug?: unknown

  gen?: unknown
  generation?: unknown

  troop?: unknown
  troopType?: unknown
  troop_type?: unknown

  rarity?: unknown

  rally?: unknown
  rallyTier?: unknown
  rally_tier?: unknown

  garrison?: unknown
  garrisonTier?: unknown
  garrison_tier?: unknown

  bear?: unknown
  bearTier?: unknown
  bear_tier?: unknown

  joiner?: unknown
  joinerTier?: unknown
  joiner_tier?: unknown

  f2p?: unknown
  isF2p?: unknown
  is_f2p?: unknown

  vip?: unknown
  isVip?: unknown
  is_vip?: unknown

  bestUse?: unknown
  best_use?: unknown

  desc?: unknown
  description?: unknown

  portrait?: unknown
  portraitUrl?: unknown
  portrait_url?: unknown

  tags?: unknown
}

export interface HeroSourcePayload {
  _meta?: unknown
  heroes?: unknown
}

export interface NormalisedHeroRecord {
  name: string
  slug: string

  generation: number | null
  troop_type: string
  rarity: string

  portrait_url: string | null
  description: string | null

  rally_tier: string | null
  garrison_tier: string | null
  bear_tier: string | null
  joiner_tier: string | null

  is_f2p: boolean | null
  is_vip: boolean | null

  best_use: string | null
  tags: string[]

  is_active: true

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}