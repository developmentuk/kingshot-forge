import type { DatasetLoadResult } from '../admin/dataEngineApi'

export type OasisLevel = {
  level?: number
  prosperity?: number | null
  prosperityRequired?: number | null
  waterEssencePerHour?: number | null
  buffs?: Array<{ label?: string; valuePct?: number; stat?: string; effect?: string }>
  buffsUnlocked?: Array<{ label?: string; valuePct?: number; stat?: string; effect?: string }>
  knownEffects?: string[]
  exactOutputKnown?: boolean
  sourceText?: string
}

export type OasisBuilding = {
  id: string
  name: string
  aliases: string[]
  recordType: string
  rarity?: string | null
  footprint?: string | null
  typeLimit?: number | null
  maxLevel?: number | null
  function?: string
  levels: OasisLevel[]
  maxEffects?: Array<{ label?: string; stat?: string; valuePct?: number }>
  images: string[]
  verification?: { status?: string; notes?: string[] }
  unlock?: Record<string, unknown>
  upgradeMechanic?: Record<string, unknown>
  maxProsperity?: number | null
}

export function normaliseOasisBuildings(result: DatasetLoadResult): OasisBuilding[] {
  return result.records.filter((record): record is OasisBuilding => {
    if (!record || typeof record !== 'object') return false
    const value = record as Record<string, unknown>
    return typeof value.id === 'string' && typeof value.name === 'string'
  }).map((record) => ({
    ...record,
    aliases: Array.isArray(record.aliases) ? record.aliases : [],
    levels: Array.isArray(record.levels) ? record.levels.map((level) => level && typeof level === 'object' ? level as OasisLevel : {}).filter(Boolean) : [],
    images: Array.isArray(record.images) ? record.images : [],
  })).sort((left, right) => left.name.localeCompare(right.name))
}

export function trustLabel(status?: string): string {
  if (status?.includes('owner_direct_ingame_verified')) return 'Verified in-game'
  if (!status) return 'Needs checking in-game.'
  if (status.includes('official_verified')) return 'Officially verified'
  if (status.includes('official')) return 'Official + community corroboration'
  if (status.includes('community')) return 'Community corroborated'
  return 'Needs checking in-game.'
}

export function imageForBuilding(building: OasisBuilding): string | undefined {
  return building.images[building.images.length - 1]
}

export function formatPercent(value: number): string {
  return `${value % 1 === 0 ? value : value.toFixed(1)}%`
}
