export interface CharmLevelSourceRecord {
  level?: unknown
  charmGuides?: unknown
  charm_guides?: unknown
  charmDesigns?: unknown
  charm_designs?: unknown
  statIncreasePct?: unknown
  stat_increase_pct?: unknown
  powerGained?: unknown
  power_gained?: unknown
  confidence?: unknown
}

export interface CharmSourcePayload {
  _meta?: unknown
  charmLevels: unknown[]
}

export interface NormalisedCharmRecord {
  key: string
  level: number

  charm_guides: number
  charm_designs: number
  stat_increase_pct: number
  power_gained: number
  confidence: number | null

  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}