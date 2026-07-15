export interface BuildingSourceRecord {
  key?: unknown
  name?: unknown
  maxLevel?: unknown
  max_level?: unknown
  source?: unknown
  note?: unknown
  costs?: unknown
}

export interface BuildingSourcePayload {
  _meta?: unknown
  buildings: unknown[]
}

export interface NormalisedBuildingRecord {
  key: string
  name: string
  max_level: number | null
  source: string | null
  note: string | null
  costs: unknown[][]

  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}