export interface TroopPointsSourceRecord {
  hog?: unknown
  kvk?: unknown
  tsg?: unknown
}

export interface TroopTierSourceRecord {
  label?: unknown
  food?: unknown
  wood?: unknown
  stone?: unknown
  iron?: unknown
  timeSec?: unknown
  time_sec?: unknown
  pts?: unknown
  status?: unknown
}

export interface TroopTypeSourceRecord {
  name?: unknown
  tiers?: unknown
}

export interface TroopSourcePayload {
  _meta?: unknown
  troops: Record<string, unknown>
}

export interface NormalisedTroopRecord {
  key: string
  troop_type: string
  troop_name: string
  tier: number
  label: string

  food: number | null
  wood: number | null
  stone: number | null
  iron: number | null
  time_seconds: number | null

  points_hog: number | null
  points_kvk: number | null
  points_tsg: number | null

  status: string | null
  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}