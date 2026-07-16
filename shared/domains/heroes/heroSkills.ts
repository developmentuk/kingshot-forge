export const HERO_SKILL_DATASET_ID = 'hero-skills' as const

export const HERO_SKILL_CATEGORIES = [
  'conquest',
  'expedition',
  'talent',
  'exclusive_gear',
] as const

export type HeroSkillCategory =
  (typeof HERO_SKILL_CATEGORIES)[number]

export interface HeroSkillSource {
  name: string | null
  url: string | null
  verifiedAt: string | null
  accuracyScore: number | null
  note: string | null
}

/**
 * Canonical editorial and published representation of a Hero Skill.
 *
 * `heroSlug` is the stable cross-layer relationship used by datasets and the
 * editorial platform. The live Supabase projection resolves it to
 * `hero_skills.hero_id` when publishing.
 */
export interface HeroSkillRecord {
  id: string
  heroSlug: string
  name: string
  category: HeroSkillCategory
  skillType: string | null
  description: string | null
  iconUrl: string | null
  slotIndex: number
  displayOrder: number
  maxLevel: number
  isActive: boolean
  source: HeroSkillSource
}

export interface HeroSkillValidationIssue {
  path: string
  message: string
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1
}

function isHeroSkillCategory(value: unknown): value is HeroSkillCategory {
  return (
    typeof value === 'string' &&
    HERO_SKILL_CATEGORIES.includes(value as HeroSkillCategory)
  )
}

export function validateHeroSkillRecord(
  value: unknown,
): HeroSkillValidationIssue[] {
  const issues: HeroSkillValidationIssue[] = []

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [{ path: '', message: 'Hero Skill must be an object.' }]
  }

  const record = value as Partial<HeroSkillRecord>

  if (!isNonEmptyString(record.id) || !ID_PATTERN.test(record.id)) {
    issues.push({
      path: 'id',
      message: 'ID must be a non-empty lowercase kebab-case value.',
    })
  }

  if (
    !isNonEmptyString(record.heroSlug) ||
    !ID_PATTERN.test(record.heroSlug)
  ) {
    issues.push({
      path: 'heroSlug',
      message: 'Hero slug must be a non-empty lowercase kebab-case value.',
    })
  }

  if (!isNonEmptyString(record.name)) {
    issues.push({ path: 'name', message: 'Name is required.' })
  }

  if (!isHeroSkillCategory(record.category)) {
    issues.push({
      path: 'category',
      message: `Category must be one of: ${HERO_SKILL_CATEGORIES.join(', ')}.`,
    })
  }

  if (!isNullableString(record.skillType)) {
    issues.push({
      path: 'skillType',
      message: 'Skill type must be text or null.',
    })
  }

  if (!isNullableString(record.description)) {
    issues.push({
      path: 'description',
      message: 'Description must be text or null.',
    })
  }

  if (!isNullableString(record.iconUrl)) {
    issues.push({
      path: 'iconUrl',
      message: 'Icon URL must be text or null.',
    })
  }

  if (!isPositiveInteger(record.slotIndex)) {
    issues.push({
      path: 'slotIndex',
      message: 'Slot index must be a positive integer.',
    })
  }

  if (!isPositiveInteger(record.displayOrder)) {
    issues.push({
      path: 'displayOrder',
      message: 'Display order must be a positive integer.',
    })
  }

  if (!isPositiveInteger(record.maxLevel)) {
    issues.push({
      path: 'maxLevel',
      message: 'Maximum level must be a positive integer.',
    })
  }

  if (typeof record.isActive !== 'boolean') {
    issues.push({
      path: 'isActive',
      message: 'Active state must be boolean.',
    })
  }

  if (!record.source || typeof record.source !== 'object') {
    issues.push({
      path: 'source',
      message: 'Source metadata is required.',
    })
  } else {
    const source = record.source as Partial<HeroSkillSource>

    if (!isNullableString(source.name)) {
      issues.push({
        path: 'source.name',
        message: 'Source name must be text or null.',
      })
    }

    if (!isNullableString(source.url)) {
      issues.push({
        path: 'source.url',
        message: 'Source URL must be text or null.',
      })
    }

    if (!isNullableString(source.verifiedAt)) {
      issues.push({
        path: 'source.verifiedAt',
        message: 'Verified date must be text or null.',
      })
    }

    if (
      source.accuracyScore !== null &&
      (typeof source.accuracyScore !== 'number' ||
        source.accuracyScore < 0 ||
        source.accuracyScore > 100)
    ) {
      issues.push({
        path: 'source.accuracyScore',
        message: 'Accuracy score must be between 0 and 100 or null.',
      })
    }

    if (!isNullableString(source.note)) {
      issues.push({
        path: 'source.note',
        message: 'Source note must be text or null.',
      })
    }
  }

  return issues
}

export function validateHeroSkillCollection(
  records: readonly HeroSkillRecord[],
): HeroSkillValidationIssue[] {
  const issues: HeroSkillValidationIssue[] = []
  const ids = new Set<string>()
  const heroSlots = new Set<string>()
  const heroDisplayOrders = new Set<string>()

  records.forEach((record, index) => {
    for (const issue of validateHeroSkillRecord(record)) {
      issues.push({
        path: `records.${index}${issue.path ? `.${issue.path}` : ''}`,
        message: issue.message,
      })
    }

    if (ids.has(record.id)) {
      issues.push({
        path: `records.${index}.id`,
        message: `Skill ID "${record.id}" is duplicated.`,
      })
    }
    ids.add(record.id)

    const slotKey = `${record.heroSlug}:${record.slotIndex}`
    if (heroSlots.has(slotKey)) {
      issues.push({
        path: `records.${index}.slotIndex`,
        message: `Hero "${record.heroSlug}" has more than one skill in slot ${record.slotIndex}.`,
      })
    }
    heroSlots.add(slotKey)

    const orderKey = `${record.heroSlug}:${record.displayOrder}`
    if (heroDisplayOrders.has(orderKey)) {
      issues.push({
        path: `records.${index}.displayOrder`,
        message: `Hero "${record.heroSlug}" has more than one skill at display order ${record.displayOrder}.`,
      })
    }
    heroDisplayOrders.add(orderKey)
  })

  return issues
}

export function sortHeroSkills(
  records: readonly HeroSkillRecord[],
): HeroSkillRecord[] {
  return [...records].sort((first, second) => {
    const heroOrder = first.heroSlug.localeCompare(second.heroSlug)
    if (heroOrder !== 0) return heroOrder

    const displayOrder = first.displayOrder - second.displayOrder
    if (displayOrder !== 0) return displayOrder

    const slotOrder = first.slotIndex - second.slotIndex
    if (slotOrder !== 0) return slotOrder

    return first.id.localeCompare(second.id)
  })
}
