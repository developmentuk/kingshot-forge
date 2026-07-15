export interface GearMaterialsSourceRecord {
  satin?: unknown
  gilded_threads?: unknown
  artisans_vision?: unknown
}

export interface GearBonusesSourceRecord {
  attack?: unknown
  defense?: unknown
}

export interface GearUpgradeStepSourceRecord {
  tier?: unknown
  stars?: unknown
  materials?: unknown
  bonuses?: unknown
  power_total?: unknown
  confidence?: unknown
}

export interface GearSourcePayload {
  _meta?: unknown
  upgradeSteps: unknown[]
}

export interface NormalisedGearRecord {
  key: string
  tier: string
  stars: number

  satin: number | null
  gilded_threads: number | null
  artisans_vision: number | null

  attack_bonus: number | null
  defense_bonus: number | null
  power_total: number | null
  confidence: number | null

  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}