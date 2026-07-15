export interface TruegoldTierValues {
  tg1?: unknown
  tg2?: unknown
  tg3?: unknown
  tg4?: unknown
  tg5?: unknown
  tg6?: unknown
  tg7?: unknown
  tg8?: unknown
}

export interface TemperedTruegoldTierValues {
  tg6?: unknown
  tg7?: unknown
  tg8?: unknown
}

export interface TruegoldBuildingSourceRecord {
  building?: unknown
  truegold?: unknown
  temperedTruegold?: unknown
  tempered_truegold?: unknown
  confidence?: unknown
}

export interface TruegoldSourcePayload {
  _meta?: unknown
  buildings: unknown[]
}

export interface NormalisedTruegoldRecord {
  key: string
  building: string

  truegold_tg1: number | null
  truegold_tg2: number | null
  truegold_tg3: number | null
  truegold_tg4: number | null
  truegold_tg5: number | null
  truegold_tg6: number | null
  truegold_tg7: number | null
  truegold_tg8: number | null

  tempered_truegold_tg6: number | null
  tempered_truegold_tg7: number | null
  tempered_truegold_tg8: number | null

  confidence: number | null
  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}