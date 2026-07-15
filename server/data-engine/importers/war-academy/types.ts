export interface WarAcademyLevelSourceRecord {
  level?: unknown
  food?: unknown
  wood?: unknown
  stone?: unknown
  iron?: unknown
  gold?: unknown
  truegoldDust?: unknown
  truegold_dust?: unknown
  timeSec?: unknown
  time_sec?: unknown
}

export interface WarAcademyTechnologySourceRecord {
  id?: unknown
  name?: unknown
  category?: unknown
  benefit?: unknown
  levels?: unknown
}

export interface WarAcademySourcePayload {
  _meta?: unknown
  technologies: unknown[]
}

export interface NormalisedWarAcademyRecord {
  key: string
  technology_id: string
  technology_name: string
  category: string
  benefit: string | null
  level: number

  food: number | null
  wood: number | null
  stone: number | null
  iron: number | null
  gold: number | null
  truegold_dust: number | null
  time_seconds: number | null

  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}