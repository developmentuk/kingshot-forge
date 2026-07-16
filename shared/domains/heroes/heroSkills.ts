export const HERO_SKILL_DATASET_ID = 'hero-skills' as const

export const HERO_SKILL_CATEGORIES = [
  'expedition',
  'exploration',
  'exclusive-gear',
  'passive',
  'other',
] as const

export type HeroSkillCategory =
  (typeof HERO_SKILL_CATEGORIES)[number]

export interface HeroSkillLevelEffect {
  level: number
  effect: string
}

export interface HeroSkillSource {
  name: string | null
  url: string | null
  verifiedAt: string | null
  accuracyScore: number | null
  note: string | null
}

export interface HeroSkillRecord {
  id: string
  heroSlug: string
  position: number
  name: string
  category: HeroSkillCategory
  summary: string | null
  effect: string | null
  levelEffects: HeroSkillLevelEffect[]
  upgradePriority: number | null
  upgradeGuidance: string | null
  iconUrl: string | null
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

  if (!Number.isInteger(record.position) || (record.position ?? 0) < 1) {
    issues.push({
      path: 'position',
      message: 'Position must be a positive integer.',
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

  if (!isNullableString(record.summary)) {
    issues.push({ path: 'summary', message: 'Summary must be text or null.' })
  }

  if (!isNullableString(record.effect)) {
    issues.push({ path: 'effect', message: 'Effect must be text or null.' })
  }

  if (!Array.isArray(record.levelEffects)) {
    issues.push({
      path: 'levelEffects',
      message: 'Level effects must be an array.',
    })
  } else {
    const levels = new Set<number>()

    record.levelEffects.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        issues.push({
          path: `levelEffects.${index}`,
          message: 'Level effect must be an object.',
        })
        return
      }

      const effect = item as Partial<HeroSkillLevelEffect>

      if (!Number.isInteger(effect.level) || (effect.level ?? 0) < 1) {
        issues.push({
          path: `levelEffects.${index}.level`,
          message: 'Level must be a positive integer.',
        })
      } else if (levels.has(effect.level)) {
        issues.push({
          path: `levelEffects.${index}.level`,
          message: `Level ${effect.level} is duplicated.`,
        })
      } else {
        levels.add(effect.level)
      }

      if (!isNonEmptyString(effect.effect)) {
        issues.push({
          path: `levelEffects.${index}.effect`,
          message: 'Level effect text is required.',
        })
      }
    })
  }

  if (
    record.upgradePriority !== null &&
    (!Number.isInteger(record.upgradePriority) ||
      (record.upgradePriority ?? 0) < 1)
  ) {
    issues.push({
      path: 'upgradePriority',
      message: 'Upgrade priority must be a positive integer or null.',
    })
  }

  if (!isNullableString(record.upgradeGuidance)) {
    issues.push({
      path: 'upgradeGuidance',
      message: 'Upgrade guidance must be text or null.',
    })
  }

  if (!isNullableString(record.iconUrl)) {
    issues.push({ path: 'iconUrl', message: 'Icon URL must be text or null.' })
  }

  if (typeof record.isActive !== 'boolean') {
    issues.push({ path: 'isActive', message: 'Active state must be boolean.' })
  }

  if (!record.source || typeof record.source !== 'object') {
    issues.push({ path: 'source', message: 'Source metadata is required.' })
  } else {
    const source = record.source as Partial<HeroSkillSource>

    if (!isNullableString(source.name)) {
      issues.push({ path: 'source.name', message: 'Source name must be text or null.' })
    }

    if (!isNullableString(source.url)) {
      issues.push({ path: 'source.url', message: 'Source URL must be text or null.' })
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
      issues.push({ path: 'source.note', message: 'Source note must be text or null.' })
    }
  }

  return issues
}

export function validateHeroSkillCollection(
  records: readonly HeroSkillRecord[],
): HeroSkillValidationIssue[] {
  const issues: HeroSkillValidationIssue[] = []
  const ids = new Set<string>()
  const heroPositions = new Set<string>()

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

    const positionKey = `${record.heroSlug}:${record.position}`
    if (heroPositions.has(positionKey)) {
      issues.push({
        path: `records.${index}.position`,
        message: `Hero "${record.heroSlug}" has more than one skill in position ${record.position}.`,
      })
    }
    heroPositions.add(positionKey)
  })

  return issues
}

export function sortHeroSkills(
  records: readonly HeroSkillRecord[],
): HeroSkillRecord[] {
  return [...records].sort((first, second) => {
    const heroOrder = first.heroSlug.localeCompare(second.heroSlug)
    if (heroOrder !== 0) return heroOrder

    const positionOrder = first.position - second.position
    if (positionOrder !== 0) return positionOrder

    return first.id.localeCompare(second.id)
  })
}
