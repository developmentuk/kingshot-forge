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
  availabilityCategory?: string | null
  footprint?: { width?: number; height?: number; display?: string } | null
  typeLimit?: number | null
  maxLevel?: number | null
  function?: string
  levels: OasisLevel[]
  maxEffects?: Array<{ label?: string; stat?: string; valuePct?: number }>
  images: { files?: string[]; levelVariants?: Record<string, string[]>; assetStem?: string; missing?: boolean | string[] }
  imageFiles: string[]
  imageVariantFiles: Record<string, string[]>
  verification?: { current?: { status?: string; provenance?: string }; history?: { status?: string; notes?: string[] } | null }
  unlock?: Record<string, unknown>
  upgradeMechanic?: Record<string, unknown>
  maxProsperity?: number | null
}

export type OasisPublicBonus = { label: string | null; stat: string | null; valuePct: number | null; effect: string | null }
export type OasisPublicTrustLabel =
  | 'Owner verified in-game'
  | 'Officially verified'
  | 'Mixed official and community evidence'
  | 'Official mechanics; values partial'
  | 'Source attachment extracted'
  | 'Community corroborated'
  | 'Partial source coverage'
  | 'Needs in-game verification'
export type OasisPublicLevel = {
  level: number | null
  prosperity: number | null
  prosperityRequired: number | null
  waterEssencePerHour: number | null
  bonuses: OasisPublicBonus[]
  knownEffects: string[]
  exactOutputKnown: boolean | null
}
export type OasisPublishedBuilding = {
  schemaVersion: 'oasis-public-projection-v2'
  id: string
  name: string
  aliases: string[]
  recordType: string
  rarity: string | null
  availabilityCategory: string | null
  footprint: { width: number | null; height: number | null; display: string | null } | null
  typeLimit: number | null
  maxLevel: number | null
  function: string | null
  levels: OasisPublicLevel[]
  maxEffects: OasisPublicBonus[]
  unlock: { requirement: string | null; initialBlueprintPurchase: string | null } | null
  upgrade: { currency: string | null; exchange: string | null; generalBlueprintRefresh: string | null; officiallyVerified: string | null } | null
  maxProsperity: number | null
  trustLabel: OasisPublicTrustLabel
  media: Array<{ url: string; alt: string; role: 'catalogue' | 'level' | 'placeholder'; levelVariant: number | null; width: number; height: number }>
  canonicalRoute: string
  status: 'published'
}

export type OasisAcceptanceDataset = {
  schemaVersion: 'oasis-public-projection-v2'
  dataset: 'oasis-island'
  status: 'current_published'
  recordCount: number
  mediaCount: number
  records: OasisPublishedBuilding[]
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
    images: record.images && typeof record.images === 'object' && !Array.isArray(record.images) ? record.images : {},
    imageFiles: Array.isArray(record.imageFiles) ? record.imageFiles : [],
    imageVariantFiles: record.imageVariantFiles && typeof record.imageVariantFiles === 'object' ? record.imageVariantFiles : {},
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
  return building.imageFiles[0]
}

export function imageForLevel(building: OasisBuilding, level: number): string | undefined {
  return building.imageVariantFiles[String(level)]?.[0] ?? building.imageFiles[0]
}

export function formatFootprint(footprint: { width?: number | null; height?: number | null; display?: string | null } | null | undefined): string {
  return footprint?.display ?? (footprint?.width && footprint?.height ? `${footprint.width}x${footprint.height}` : 'Not available')
}

export function searchTextForBuilding(building: OasisBuilding): string {
  const bonuses = building.levels.flatMap((level) => [...(level.buffs ?? []), ...(level.buffsUnlocked ?? [])])
  const effects = [...bonuses, ...(building.maxEffects ?? [])]
  return [building.name, ...building.aliases, building.function ?? '', building.rarity ?? '', ...effects.flatMap((effect) => [effect.label ?? '', effect.stat ?? '', 'effect' in effect && typeof effect.effect === 'string' ? effect.effect : '', effect.valuePct == null ? '' : String(effect.valuePct)]), ...building.levels.flatMap((level) => level.knownEffects ?? [])].join(' ').toLocaleLowerCase()
}

export function formatPercent(value: number): string {
  return `${value % 1 === 0 ? value : value.toFixed(1)}%`
}

export function imageForPublishedBuilding(building: OasisPublishedBuilding): string | undefined {
  return building.media.find((media) => media.role === 'catalogue')?.url ?? building.media[0]?.url
}

export function searchTextForPublishedBuilding(building: OasisPublishedBuilding): string {
  const effects = [...building.levels.flatMap((level) => level.bonuses), ...building.maxEffects]
  return [building.name, ...building.aliases, building.function ?? '', building.rarity ?? '', ...effects.flatMap((effect) => [effect.label ?? '', effect.stat ?? '', effect.effect ?? '', effect.valuePct == null ? '' : String(effect.valuePct)]), ...building.levels.flatMap((level) => level.knownEffects)].join(' ').toLocaleLowerCase()
}
