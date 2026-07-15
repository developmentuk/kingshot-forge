export interface MasterSourceRecord {
  name?: unknown
  gen?: unknown
  generation?: unknown
  role?: unknown
  passive?: unknown
  skills?: unknown
  total_power?: unknown
  totalPower?: unknown
  manuscripts?: unknown
  unlock_order?: unknown
  unlockOrder?: unknown
  confidence?: unknown
  confidence_note?: unknown
  confidenceNote?: unknown
}

export interface MastersSourcePayload {
  _meta?: unknown
  masters: unknown[]
}

export interface NormalisedMasterRecord {
  key: string
  name: string
  generation: number | null
  role: string
  passive: string | null
  skills: string[]
  total_power: number | null
  manuscripts: number | null
  unlock_order: number | null
  confidence: number | null
  confidence_note: string | null

  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}