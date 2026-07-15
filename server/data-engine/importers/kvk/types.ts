export interface KvkActionSourceRecord {
  label?: unknown
  unit?: unknown
  pts?: unknown
  points?: unknown
}

export interface KvkDaySourceRecord {
  day?: unknown
  name?: unknown
  actions?: unknown
}

export interface KvkSourcePayload {
  _meta?: unknown
  days: unknown[]
}

export interface NormalisedKvkRecord {
  key: string

  day: number
  day_name: string

  action_label: string
  unit: string
  points: number

  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}