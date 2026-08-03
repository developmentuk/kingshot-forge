export type BuildingProgressionRow = Record<string, unknown>

export type BuildingCompanionRecord = {
  key: string
  name: string
  category: string
  description: string
  maxLevel: number | null
  truegold: boolean
  progression: BuildingProgressionRow[]
  source?: string
  verificationNote?: string
  imageUrl?: string
  imageAltText?: string
  imageCredit?: string
  imageSourceUrl?: string
  imageLicense?: string
}

export type BuildingEffectMetric = {
  key: string
  label: string
  shortLabel: string
  format?: 'number' | 'percent' | 'seconds'
}

export const BUILDING_EFFECT_METRICS: BuildingEffectMetric[] = [
  { key: 'max_hero_level', label: 'Maximum hero level', shortLabel: 'Hero level cap' },
  { key: 'training_capacity', label: 'Training capacity', shortLabel: 'Training capacity' },
  { key: 'training_speed_percent', label: 'Training speed', shortLabel: 'Training speed', format: 'percent' },
  { key: 'rally_capacity', label: 'Rally capacity', shortLabel: 'Rally capacity' },
  { key: 'troop_deploy_capacity', label: 'Troop deployment capacity', shortLabel: 'Troop deployment' },
  { key: 'reinforcement_capacity', label: 'Reinforcement capacity', shortLabel: 'Reinforcement capacity' },
  { key: 'ally_help_count', label: 'Alliance Help count', shortLabel: 'Alliance Helps' },
  { key: 'ally_help_seconds', label: 'Time reduced per Alliance Help', shortLabel: 'Help time reduction', format: 'seconds' },
  { key: 'protected_resource_capacity', label: 'Protected resource capacity', shortLabel: 'Protected resources' },
  { key: 'infirmary_capacity', label: 'Infirmary capacity', shortLabel: 'Infirmary capacity' },
]

export function textValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function isPopulatedNumber(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
}

export function titleCase(value: string): string {
  return value
    .replace(/(^|[-_\s])\w/g, (match) => match.toUpperCase())
    .replace(/[-_]/g, ' ')
}

export function normaliseBuildings(records: unknown[]): BuildingCompanionRecord[] {
  const map = new Map<string, BuildingCompanionRecord>()

  records.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return

    const record = raw as Record<string, unknown>
    const key = textValue(record.building_key, textValue(record.key))
    const name = textValue(record.building_name, textValue(record.name))

    if (!key || !name) return

    const current = map.get(key) ?? {
      key,
      name,
      category: textValue(record.category, 'Buildings'),
      description: textValue(record.description, 'Verified building progression and upgrade effects.'),
      maxLevel: numberValue(record.standard_max_level ?? record.max_level),
      truegold: record.truegold_supported === true || record.truegold === true,
      progression: [],
      source: textValue(record.source_url, textValue(record.source)),
      verificationNote: textValue(record.verification_note, textValue(record.note)),
      imageUrl: textValue(record.image_url),
      imageAltText: textValue(record.image_alt_text),
      imageCredit: textValue(record.image_credit),
      imageSourceUrl: textValue(record.image_source_url),
      imageLicense: textValue(record.image_license),
    }

    if (Array.isArray(record.progression)) {
      current.progression.push(
        ...record.progression.filter(
          (row): row is BuildingProgressionRow => Boolean(row) && typeof row === 'object',
        ),
      )
    } else if (
      record.record_id ||
      record.level_label ||
      record.level ||
      record.base_level
    ) {
      current.progression.push(record)
    }

    map.set(key, current)
  })

  return [...map.values()].sort((left, right) => left.name.localeCompare(right.name))
}
