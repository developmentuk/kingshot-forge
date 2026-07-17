import { createHash } from 'node:crypto'

import {
  canSourceEvidenceSupportCanonical,
  isSha256Digest,
  toPublicSourceSummary,
  type PublicSourceSummary,
  type SourceEvidenceRecord,
} from '../../platform/source-evidence.js'

export const HERO_SKILL_DATASET_ID = 'hero-skills' as const

export const HERO_SKILL_CATEGORIES = [
  'conquest',
  'expedition',
  'talent',
] as const

export const HERO_SKILL_VARIANT_KINDS = [
  'base',
  'awakening',
] as const

export const HERO_SKILL_VERIFICATION_STATES = [
  'unreviewed',
  'reviewed',
  'verified',
  'rejected',
  'withdrawn',
] as const

export const HERO_SKILL_DATA_AVAILABILITY = [
  'complete',
  'partial',
  'unavailable',
  'unknown',
] as const

export const HERO_SKILL_PUBLICATION_ELIGIBILITY = [
  'blocked',
  'eligible',
  'withdrawn',
] as const

export const HERO_SKILL_UNLOCK_REQUIREMENT_TYPES = [
  'hero_level',
  'hero_star_level',
  'skill_level',
  'widget_level',
  'exclusive_gear_level',
  'awakening_state',
  'other',
] as const

export const HERO_SKILL_UNLOCK_OPERATORS = [
  'eq',
  'neq',
  'gte',
  'lte',
  'in',
] as const

export const HERO_SKILL_REQUIREMENT_COMBINATORS = [
  'all',
  'any',
] as const

export const HERO_SKILL_ID_NAMESPACE =
  '8d7a8d8a-709f-4e75-a2f5-9347a2bf30e0' as const

export type HeroSkillCategory =
  (typeof HERO_SKILL_CATEGORIES)[number]

export type HeroSkillVariantKind =
  (typeof HERO_SKILL_VARIANT_KINDS)[number]

export type HeroSkillVerificationState =
  (typeof HERO_SKILL_VERIFICATION_STATES)[number]

export type HeroSkillDataAvailability =
  (typeof HERO_SKILL_DATA_AVAILABILITY)[number]

export type HeroSkillPublicationEligibility =
  (typeof HERO_SKILL_PUBLICATION_ELIGIBILITY)[number]

export type HeroSkillUnlockRequirementType =
  (typeof HERO_SKILL_UNLOCK_REQUIREMENT_TYPES)[number]

export type HeroSkillUnlockOperator =
  (typeof HERO_SKILL_UNLOCK_OPERATORS)[number]

export type HeroSkillRequirementCombinator =
  (typeof HERO_SKILL_REQUIREMENT_COMBINATORS)[number]

export type HeroSkillUnlockValue =
  | number
  | string
  | boolean
  | readonly (number | string)[]

export interface HeroSkillIdentityInput {
  heroId: string
  category: HeroSkillCategory
  slot: number
  variantKind: HeroSkillVariantKind
  variantIndex: number
}

export interface HeroSkillIdentity {
  id: string
  identitySeed: string
  identityVersion: 1
}

export interface HeroSkillStructuredEffect {
  semanticType: string
  numericValue: number
  unit: string | null
  label: string | null
}

export interface HeroSkillProgressionLevel {
  id: string
  identitySeed: string
  skillId: string
  level: number
  canonicalText: string
  effects: readonly HeroSkillStructuredEffect[]
  sourceEvidenceId: string
  verificationState: HeroSkillVerificationState
  displayOrder: number
  withdrawnAt: string | null
  withdrawalReason: string | null
  revision: number
  createdAt: string
  updatedAt: string
}

export interface HeroSkillUnlockRequirement {
  id: string
  identitySeed: string
  skillId: string
  type: HeroSkillUnlockRequirementType
  operator: HeroSkillUnlockOperator
  value: HeroSkillUnlockValue
  relatedDomainId: string | null
  displayFallback: string | null
  sourceEvidenceId: string
  verificationState: HeroSkillVerificationState
  order: number
  withdrawnAt: string | null
  withdrawalReason: string | null
  revision: number
  createdAt: string
  updatedAt: string
}

export interface HeroSkillUnlockRequirementGroup {
  id: string
  identitySeed: string
  operator: HeroSkillRequirementCombinator
  order: number
  requirements: readonly HeroSkillUnlockRequirement[]
}

export interface HeroSkillUnlockConditionSet {
  operator: HeroSkillRequirementCombinator
  groups: readonly HeroSkillUnlockRequirementGroup[]
}

export interface HeroSkillSourceBinding {
  sourceIdentity: string
  sourceVersion: string | null
  sourceEvidenceDigest: string
  primaryEvidenceId: string
  evidenceIds: readonly string[]
}

/**
 * Canonical Hero Skill fact contract.
 *
 * Editorial recommendations and Exclusive Gear facts are deliberately absent.
 * The current public/editor compatibility types remain separate until the
 * unapplied Sprint 9.3 schema proposal is reviewed and approved.
 */
export interface HeroSkillRecord {
  id: string
  identitySeed: string
  identityVersion: 1
  heroId: string
  variantKind: HeroSkillVariantKind
  variantIndex: number
  name: string
  category: HeroSkillCategory
  slot: number
  displayOrder: number
  description: string | null
  maxLevel: number | null
  progressionAvailability: HeroSkillDataAvailability
  progression: readonly HeroSkillProgressionLevel[]
  unlockAvailability: HeroSkillDataAvailability
  unlocks: HeroSkillUnlockConditionSet | null
  verificationState: HeroSkillVerificationState
  publicationEligibility: HeroSkillPublicationEligibility
  source: HeroSkillSourceBinding
  reviewedBy: string | null
  reviewedAt: string | null
  revision: number
  publishedVersionId: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  withdrawnAt: string | null
  withdrawalReason: string | null
}

export interface PublicHeroSkillProgressionLevel {
  level: number
  canonicalText: string
  effects: readonly HeroSkillStructuredEffect[]
  displayOrder: number
}

export interface PublicHeroSkillUnlockRequirement {
  type: HeroSkillUnlockRequirementType
  operator: HeroSkillUnlockOperator
  value: HeroSkillUnlockValue
  relatedDomainId: string | null
  displayFallback: string | null
  order: number
}

export interface PublicHeroSkillUnlockGroup {
  operator: HeroSkillRequirementCombinator
  order: number
  requirements: readonly PublicHeroSkillUnlockRequirement[]
}

export interface PublicHeroSkillProjection {
  id: string
  heroId: string
  name: string
  category: HeroSkillCategory
  slot: number
  displayOrder: number
  description: string | null
  maxLevel: number | null
  progressionAvailability: HeroSkillDataAvailability
  progression: readonly PublicHeroSkillProgressionLevel[]
  unlockAvailability: HeroSkillDataAvailability
  unlockOperator: HeroSkillRequirementCombinator | null
  unlockGroups: readonly PublicHeroSkillUnlockGroup[]
  source: PublicSourceSummary
  publishedVersionId: string
  publishedAt: string
}

export interface HeroSkillValidationIssue {
  path: string
  message: string
}

export type HeroSkillPublicationBlocker =
  | 'invalid-record'
  | 'missing-name'
  | 'missing-description'
  | 'unverified-record'
  | 'withdrawn-record'
  | 'missing-review'
  | 'missing-source-evidence'
  | 'unapproved-source-evidence'
  | 'source-digest-mismatch'
  | 'unverified-progression'
  | 'unverified-unlock'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const HERO_SKILL_IDENTITY_SEED_PATTERN = new RegExp(
  '^hero-skill:v1\\|hero=[0-9a-f-]{36}' +
    '\\|category=(conquest|expedition|talent)' +
    '\\|slot=[1-9][0-9]*\\|variant=(base|awakening)' +
    '\\|variant-index=[1-9][0-9]*$',
  'i',
)
const HERO_SKILL_LEVEL_IDENTITY_SEED_PATTERN =
  /^hero-skill:level:v1\|skill=[0-9a-f-]{36}\|level=[1-9][0-9]*$/i
const HERO_SKILL_UNLOCK_GROUP_IDENTITY_SEED_PATTERN =
  /^hero-skill:unlock-group:v1\|skill=[0-9a-f-]{36}\|group=[1-9][0-9]*$/i
const HERO_SKILL_UNLOCK_IDENTITY_SEED_PATTERN =
  /^hero-skill:unlock:v1\|skill=[0-9a-f-]{36}\|group=[1-9][0-9]*\|requirement=[1-9][0-9]*$/i

const EDITORIAL_ONLY_FIELDS = [
  'upgradePriority',
  'recommendedBuildOrder',
  'bestUse',
  'strengths',
  'weaknesses',
  'synergies',
  'formationRecommendations',
  'exclusiveGearEffects',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    !Number.isNaN(Date.parse(value))
  )
}

function isNullableTimestamp(value: unknown): value is string | null {
  return value === null || isTimestamp(value)
}

function includesValue<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return typeof value === 'string' && values.includes(value as T)
}

function uuidBytes(value: string): Buffer {
  return Buffer.from(value.replaceAll('-', ''), 'hex')
}

function formatUuid(bytes: Buffer): string {
  const hex = bytes.toString('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

function createUuidV5(seed: string): string {
  const hash = createHash('sha1')
    .update(uuidBytes(HERO_SKILL_ID_NAMESPACE))
    .update(seed, 'utf8')
    .digest()
    .subarray(0, 16)

  hash[6] = (hash[6] & 0x0f) | 0x50
  hash[8] = (hash[8] & 0x3f) | 0x80

  return formatUuid(hash)
}

export function createHeroSkillIdentity(
  input: HeroSkillIdentityInput,
): HeroSkillIdentity {
  if (!UUID_PATTERN.test(input.heroId)) {
    throw new Error('Canonical Hero ID must be a UUID.')
  }
  if (!includesValue(HERO_SKILL_CATEGORIES, input.category)) {
    throw new Error('Hero Skill category is invalid.')
  }
  if (!isPositiveInteger(input.slot)) {
    throw new Error('Hero Skill slot must be a positive integer.')
  }
  if (!includesValue(HERO_SKILL_VARIANT_KINDS, input.variantKind)) {
    throw new Error('Hero Skill variant is invalid.')
  }
  if (!isPositiveInteger(input.variantIndex)) {
    throw new Error('Hero Skill variant index must be a positive integer.')
  }

  const identitySeed = [
    'hero-skill:v1',
    `hero=${input.heroId.toLowerCase()}`,
    `category=${input.category}`,
    `slot=${input.slot}`,
    `variant=${input.variantKind}`,
    `variant-index=${input.variantIndex}`,
  ].join('|')

  return {
    id: createUuidV5(identitySeed),
    identitySeed,
    identityVersion: 1,
  }
}

export function createHeroSkillProgressionIdentity(
  skillId: string,
  level: number,
): HeroSkillIdentity {
  if (!UUID_PATTERN.test(skillId) || !isPositiveInteger(level)) {
    throw new Error('Progression identity requires a skill UUID and positive level.')
  }
  const identitySeed = `hero-skill:level:v1|skill=${skillId.toLowerCase()}|level=${level}`
  return {
    id: createUuidV5(identitySeed),
    identitySeed,
    identityVersion: 1,
  }
}

export function createHeroSkillUnlockIdentity(
  skillId: string,
  groupOrder: number,
  requirementOrder: number,
): HeroSkillIdentity {
  if (
    !UUID_PATTERN.test(skillId) ||
    !isPositiveInteger(groupOrder) ||
    !isPositiveInteger(requirementOrder)
  ) {
    throw new Error(
      'Unlock identity requires a skill UUID and positive group/requirement order.',
    )
  }
  const identitySeed =
    `hero-skill:unlock:v1|skill=${skillId.toLowerCase()}` +
    `|group=${groupOrder}|requirement=${requirementOrder}`
  return {
    id: createUuidV5(identitySeed),
    identitySeed,
    identityVersion: 1,
  }
}

export function createHeroSkillUnlockGroupIdentity(
  skillId: string,
  groupOrder: number,
): HeroSkillIdentity {
  if (!UUID_PATTERN.test(skillId) || !isPositiveInteger(groupOrder)) {
    throw new Error(
      'Unlock group identity requires a skill UUID and positive group order.',
    )
  }
  const identitySeed =
    `hero-skill:unlock-group:v1|skill=${skillId.toLowerCase()}` +
    `|group=${groupOrder}`
  return {
    id: createUuidV5(identitySeed),
    identitySeed,
    identityVersion: 1,
  }
}

function validateLifecycle(
  value: {
    withdrawnAt?: unknown
    withdrawalReason?: unknown
    revision?: unknown
    createdAt?: unknown
    updatedAt?: unknown
  },
  path: string,
): HeroSkillValidationIssue[] {
  const issues: HeroSkillValidationIssue[] = []

  if (!isNullableTimestamp(value.withdrawnAt)) {
    issues.push({
      path: `${path}.withdrawnAt`,
      message: 'Withdrawal timestamp must be a valid date-time or null.',
    })
  }
  if (!isNullableString(value.withdrawalReason)) {
    issues.push({
      path: `${path}.withdrawalReason`,
      message: 'Withdrawal reason must be text or null.',
    })
  }
  if (value.withdrawnAt !== null && !isNonEmptyString(value.withdrawalReason)) {
    issues.push({
      path: `${path}.withdrawalReason`,
      message: 'Withdrawn data requires a reason.',
    })
  }
  if (!isPositiveInteger(value.revision)) {
    issues.push({
      path: `${path}.revision`,
      message: 'Revision must be a positive integer.',
    })
  }
  if (!isTimestamp(value.createdAt)) {
    issues.push({
      path: `${path}.createdAt`,
      message: 'Created timestamp must be a valid date-time.',
    })
  }
  if (!isTimestamp(value.updatedAt)) {
    issues.push({
      path: `${path}.updatedAt`,
      message: 'Updated timestamp must be a valid date-time.',
    })
  }

  return issues
}

export function validateHeroSkillProgression(
  levels: readonly HeroSkillProgressionLevel[],
  skillId: string,
): HeroSkillValidationIssue[] {
  const issues: HeroSkillValidationIssue[] = []
  const ids = new Set<string>()
  const levelNumbers = new Set<number>()
  const displayOrders = new Set<number>()

  levels.forEach((level, index) => {
    const path = `progression.${index}`

    if (!isRecord(level)) {
      issues.push({ path, message: 'Progression level must be an object.' })
      return
    }

    if (!UUID_PATTERN.test(level.id)) {
      issues.push({ path: `${path}.id`, message: 'Progression ID must be a UUID.' })
    } else if (createUuidV5(level.identitySeed) !== level.id) {
      issues.push({
        path: `${path}.id`,
        message: 'Progression ID does not match its immutable identity seed.',
      })
    }
    if (!HERO_SKILL_LEVEL_IDENTITY_SEED_PATTERN.test(level.identitySeed)) {
      issues.push({
        path: `${path}.identitySeed`,
        message: 'Progression identity seed is invalid.',
      })
    }
    if (level.skillId !== skillId) {
      issues.push({
        path: `${path}.skillId`,
        message: 'Progression row belongs to a different Hero Skill.',
      })
    }
    if (!isPositiveInteger(level.level)) {
      issues.push({ path: `${path}.level`, message: 'Level must be positive.' })
    }
    if (!isNonEmptyString(level.canonicalText)) {
      issues.push({
        path: `${path}.canonicalText`,
        message: 'Canonical level text is required.',
      })
    }
    if (!isPositiveInteger(level.displayOrder)) {
      issues.push({
        path: `${path}.displayOrder`,
        message: 'Display order must be positive.',
      })
    }
    if (!UUID_PATTERN.test(level.sourceEvidenceId)) {
      issues.push({
        path: `${path}.sourceEvidenceId`,
        message: 'Progression requires a source evidence UUID.',
      })
    }
    if (
      !includesValue(
        HERO_SKILL_VERIFICATION_STATES,
        level.verificationState,
      )
    ) {
      issues.push({
        path: `${path}.verificationState`,
        message: 'Progression verification state is invalid.',
      })
    }
    if (!Array.isArray(level.effects)) {
      issues.push({
        path: `${path}.effects`,
        message: 'Structured effects must be an array.',
      })
    } else {
      level.effects.forEach((effect, effectIndex) => {
        if (!isNonEmptyString(effect.semanticType)) {
          issues.push({
            path: `${path}.effects.${effectIndex}.semanticType`,
            message: 'Structured effect semantic type is required.',
          })
        }
        if (!Number.isFinite(effect.numericValue)) {
          issues.push({
            path: `${path}.effects.${effectIndex}.numericValue`,
            message: 'Structured effect value must be finite.',
          })
        }
        if (!isNullableString(effect.unit) || !isNullableString(effect.label)) {
          issues.push({
            path: `${path}.effects.${effectIndex}`,
            message: 'Structured effect unit and label must be text or null.',
          })
        }
      })
    }

    issues.push(...validateLifecycle(level, path))

    if (ids.has(level.id)) {
      issues.push({ path: `${path}.id`, message: 'Progression ID is duplicated.' })
    }
    if (levelNumbers.has(level.level)) {
      issues.push({
        path: `${path}.level`,
        message: `Progression level ${level.level} is duplicated.`,
      })
    }
    if (displayOrders.has(level.displayOrder)) {
      issues.push({
        path: `${path}.displayOrder`,
        message: `Progression order ${level.displayOrder} is duplicated.`,
      })
    }
    if (index > 0 && levels[index - 1].level >= level.level) {
      issues.push({
        path: `${path}.level`,
        message: 'Progression levels must be supplied in ascending order.',
      })
    }

    ids.add(level.id)
    levelNumbers.add(level.level)
    displayOrders.add(level.displayOrder)
  })

  return issues
}

function isValidRequirementValue(
  requirement: HeroSkillUnlockRequirement,
): boolean {
  const numericTypes: readonly HeroSkillUnlockRequirementType[] = [
    'hero_level',
    'hero_star_level',
    'skill_level',
    'widget_level',
    'exclusive_gear_level',
  ]

  if (numericTypes.includes(requirement.type)) {
    return Number.isInteger(requirement.value) && Number(requirement.value) >= 0
  }
  if (requirement.type === 'awakening_state') {
    return typeof requirement.value === 'string' && requirement.value.length > 0
  }
  return (
    typeof requirement.value === 'string' ||
    typeof requirement.value === 'number' ||
    typeof requirement.value === 'boolean' ||
    Array.isArray(requirement.value)
  )
}

function isValidRequirementOperator(
  requirement: HeroSkillUnlockRequirement,
): boolean {
  if (requirement.operator === 'in') {
    return Array.isArray(requirement.value) && requirement.value.length > 0
  }
  if (requirement.type === 'awakening_state') {
    return requirement.operator === 'eq' || requirement.operator === 'neq'
  }
  return includesValue(HERO_SKILL_UNLOCK_OPERATORS, requirement.operator)
}

export function validateHeroSkillUnlocks(
  unlocks: HeroSkillUnlockConditionSet | null,
  skillId: string,
): HeroSkillValidationIssue[] {
  if (unlocks === null) return []

  const issues: HeroSkillValidationIssue[] = []
  if (!isRecord(unlocks as unknown)) {
    return [{ path: 'unlocks', message: 'Unlocks must be an object or null.' }]
  }
  if (!includesValue(HERO_SKILL_REQUIREMENT_COMBINATORS, unlocks.operator)) {
    issues.push({ path: 'unlocks.operator', message: 'Unlock operator is invalid.' })
  }

  if (!Array.isArray(unlocks.groups)) {
    issues.push({ path: 'unlocks.groups', message: 'Unlock groups must be an array.' })
    return issues
  }

  const groupIds = new Set<string>()
  const groupOrders = new Set<number>()
  unlocks.groups.forEach((group, groupIndex) => {
    const groupPath = `unlocks.groups.${groupIndex}`
    if (!isRecord(group as unknown)) {
      issues.push({ path: groupPath, message: 'Unlock group must be an object.' })
      return
    }
    if (!UUID_PATTERN.test(group.id)) {
      issues.push({ path: `${groupPath}.id`, message: 'Unlock group ID must be a UUID.' })
    } else if (createUuidV5(group.identitySeed) !== group.id) {
      issues.push({
        path: `${groupPath}.id`,
        message: 'Unlock group ID does not match its immutable identity seed.',
      })
    }
    if (!HERO_SKILL_UNLOCK_GROUP_IDENTITY_SEED_PATTERN.test(group.identitySeed)) {
      issues.push({
        path: `${groupPath}.identitySeed`,
        message: 'Unlock group identity seed is invalid.',
      })
    }
    if (!includesValue(HERO_SKILL_REQUIREMENT_COMBINATORS, group.operator)) {
      issues.push({
        path: `${groupPath}.operator`,
        message: 'Unlock group operator is invalid.',
      })
    }
    if (!isPositiveInteger(group.order)) {
      issues.push({
        path: `${groupPath}.order`,
        message: 'Unlock group order must be positive.',
      })
    }
    if (!Array.isArray(group.requirements)) {
      issues.push({
        path: `${groupPath}.requirements`,
        message: 'Unlock requirements must be an array.',
      })
      return
    }
    if (group.requirements.length === 0) {
      issues.push({
        path: `${groupPath}.requirements`,
        message: 'Unlock group must contain a requirement.',
      })
    }
    if (groupIds.has(group.id)) {
      issues.push({ path: `${groupPath}.id`, message: 'Unlock group ID is duplicated.' })
    }
    if (groupOrders.has(group.order)) {
      issues.push({
        path: `${groupPath}.order`,
        message: 'Unlock group order is duplicated.',
      })
    }
    if (groupIndex > 0 && unlocks.groups[groupIndex - 1].order >= group.order) {
      issues.push({
        path: `${groupPath}.order`,
        message: 'Unlock groups must be supplied in ascending order.',
      })
    }
    groupIds.add(group.id)
    groupOrders.add(group.order)

    const requirementIds = new Set<string>()
    const requirementOrders = new Set<number>()
    group.requirements.forEach((
      requirement: HeroSkillUnlockRequirement,
      requirementIndex: number,
    ) => {
      const path = `${groupPath}.requirements.${requirementIndex}`
      if (!isRecord(requirement as unknown)) {
        issues.push({ path, message: 'Unlock requirement must be an object.' })
        return
      }
      if (!UUID_PATTERN.test(requirement.id)) {
        issues.push({ path: `${path}.id`, message: 'Requirement ID must be a UUID.' })
      } else if (createUuidV5(requirement.identitySeed) !== requirement.id) {
        issues.push({
          path: `${path}.id`,
          message: 'Requirement ID does not match its immutable identity seed.',
        })
      }
      if (!HERO_SKILL_UNLOCK_IDENTITY_SEED_PATTERN.test(requirement.identitySeed)) {
        issues.push({
          path: `${path}.identitySeed`,
          message: 'Requirement identity seed is invalid.',
        })
      }
      if (requirement.skillId !== skillId) {
        issues.push({
          path: `${path}.skillId`,
          message: 'Unlock requirement belongs to a different Hero Skill.',
        })
      }
      if (!includesValue(HERO_SKILL_UNLOCK_REQUIREMENT_TYPES, requirement.type)) {
        issues.push({ path: `${path}.type`, message: 'Requirement type is invalid.' })
      }
      if (!isValidRequirementOperator(requirement)) {
        issues.push({
          path: `${path}.operator`,
          message: 'Requirement operator is invalid for its type and value.',
        })
      }
      if (!isValidRequirementValue(requirement)) {
        issues.push({
          path: `${path}.value`,
          message: 'Requirement value is invalid for its type.',
        })
      }
      if (!isNullableString(requirement.relatedDomainId)) {
        issues.push({
          path: `${path}.relatedDomainId`,
          message: 'Related domain identity must be text or null.',
        })
      }
      if (!isNullableString(requirement.displayFallback)) {
        issues.push({
          path: `${path}.displayFallback`,
          message: 'Display fallback must be text or null.',
        })
      }
      if (
        requirement.type === 'other' &&
        !isNonEmptyString(requirement.displayFallback)
      ) {
        issues.push({
          path: `${path}.displayFallback`,
          message: 'Other requirements need an evidenced display fallback.',
        })
      }
      if (!UUID_PATTERN.test(requirement.sourceEvidenceId)) {
        issues.push({
          path: `${path}.sourceEvidenceId`,
          message: 'Unlock requirement requires a source evidence UUID.',
        })
      }
      if (
        !includesValue(
          HERO_SKILL_VERIFICATION_STATES,
          requirement.verificationState,
        )
      ) {
        issues.push({
          path: `${path}.verificationState`,
          message: 'Unlock verification state is invalid.',
        })
      }
      if (!isPositiveInteger(requirement.order)) {
        issues.push({ path: `${path}.order`, message: 'Requirement order must be positive.' })
      }
      issues.push(...validateLifecycle(requirement, path))

      if (requirementIds.has(requirement.id)) {
        issues.push({ path: `${path}.id`, message: 'Requirement ID is duplicated.' })
      }
      if (requirementOrders.has(requirement.order)) {
        issues.push({ path: `${path}.order`, message: 'Requirement order is duplicated.' })
      }
      if (
        requirementIndex > 0 &&
        group.requirements[requirementIndex - 1].order >= requirement.order
      ) {
        issues.push({
          path: `${path}.order`,
          message: 'Requirements must be supplied in ascending order.',
        })
      }
      requirementIds.add(requirement.id)
      requirementOrders.add(requirement.order)
    })
  })

  return issues
}

export function validateHeroSkillRecord(
  value: unknown,
  evidenceRecords: readonly SourceEvidenceRecord[] = [],
): HeroSkillValidationIssue[] {
  if (!isRecord(value)) {
    return [{ path: '', message: 'Hero Skill must be an object.' }]
  }

  const record = value as Partial<HeroSkillRecord>
  const issues: HeroSkillValidationIssue[] = []

  for (const field of EDITORIAL_ONLY_FIELDS) {
    if (field in value) {
      issues.push({
        path: field,
        message: `${field} belongs to Editorial guidance, not canonical Hero Skill facts.`,
      })
    }
  }

  if (typeof record.id !== 'string' || !UUID_PATTERN.test(record.id)) {
    issues.push({ path: 'id', message: 'Hero Skill ID must be a UUID.' })
  } else if (
    typeof record.identitySeed === 'string' &&
    createUuidV5(record.identitySeed) !== record.id
  ) {
    issues.push({
      path: 'id',
      message: 'Hero Skill ID does not match its immutable identity seed.',
    })
  }

  if (
    typeof record.identitySeed !== 'string' ||
    !HERO_SKILL_IDENTITY_SEED_PATTERN.test(record.identitySeed)
  ) {
    issues.push({
      path: 'identitySeed',
      message: 'Hero Skill identity seed is invalid.',
    })
  }

  if (record.identityVersion !== 1) {
    issues.push({
      path: 'identityVersion',
      message: 'Hero Skill identity version must be 1.',
    })
  }

  if (typeof record.heroId !== 'string' || !UUID_PATTERN.test(record.heroId)) {
    issues.push({ path: 'heroId', message: 'Canonical Hero ID must be a UUID.' })
  }

  if (!includesValue(HERO_SKILL_VARIANT_KINDS, record.variantKind)) {
    issues.push({ path: 'variantKind', message: 'Hero Skill variant is invalid.' })
  }
  if (!isPositiveInteger(record.variantIndex)) {
    issues.push({
      path: 'variantIndex',
      message: 'Hero Skill variant index must be positive.',
    })
  }
  if (!isNonEmptyString(record.name)) {
    issues.push({ path: 'name', message: 'Canonical skill name is required.' })
  } else if (record.name.length > 120) {
    issues.push({ path: 'name', message: 'Canonical skill name is too long.' })
  }
  if (!includesValue(HERO_SKILL_CATEGORIES, record.category)) {
    issues.push({
      path: 'category',
      message: 'Hero Skill category must exclude Exclusive Gear.',
    })
  }
  if (!isPositiveInteger(record.slot)) {
    issues.push({ path: 'slot', message: 'Canonical slot must be positive.' })
  }
  if (!isPositiveInteger(record.displayOrder)) {
    issues.push({
      path: 'displayOrder',
      message: 'Display order must be positive.',
    })
  }
  if (!isNullableString(record.description)) {
    issues.push({
      path: 'description',
      message: 'Canonical description must be text or null.',
    })
  }
  if (record.maxLevel !== null && !isPositiveInteger(record.maxLevel)) {
    issues.push({
      path: 'maxLevel',
      message: 'Maximum level must be positive or null.',
    })
  }

  if (
    !includesValue(
      HERO_SKILL_DATA_AVAILABILITY,
      record.progressionAvailability,
    )
  ) {
    issues.push({
      path: 'progressionAvailability',
      message: 'Progression availability is invalid.',
    })
  }
  if (!Array.isArray(record.progression)) {
    issues.push({ path: 'progression', message: 'Progression must be an array.' })
  } else if (typeof record.id === 'string') {
    issues.push(...validateHeroSkillProgression(record.progression, record.id))

    const highestLevel = record.progression.at(-1)?.level ?? null
    if (
      record.progressionAvailability === 'complete' &&
      (record.maxLevel === null ||
        highestLevel !== record.maxLevel ||
        record.progression.length !== record.maxLevel ||
        record.progression.some((level, index) => level.level !== index + 1))
    ) {
      issues.push({
        path: 'progression',
        message: 'Complete progression must contain every level from 1 through maxLevel.',
      })
    }
    if (
      (record.progressionAvailability === 'unavailable' ||
        record.progressionAvailability === 'unknown') &&
      record.progression.length > 0
    ) {
      issues.push({
        path: 'progressionAvailability',
        message: 'Unavailable or unknown progression cannot contain level rows.',
      })
    }
    if (
      record.progressionAvailability === 'partial' &&
      record.progression.length === 0
    ) {
      issues.push({
        path: 'progressionAvailability',
        message: 'Partial progression requires at least one evidenced level.',
      })
    }
  }

  if (
    !includesValue(HERO_SKILL_DATA_AVAILABILITY, record.unlockAvailability)
  ) {
    issues.push({
      path: 'unlockAvailability',
      message: 'Unlock availability is invalid.',
    })
  }
  if (record.unlocks !== null && !isRecord(record.unlocks)) {
    issues.push({ path: 'unlocks', message: 'Unlocks must be an object or null.' })
  } else if (typeof record.id === 'string') {
    issues.push(...validateHeroSkillUnlocks(record.unlocks ?? null, record.id))
  }
  if (
    (record.unlockAvailability === 'unavailable' ||
      record.unlockAvailability === 'unknown') &&
    record.unlocks !== null
  ) {
    issues.push({
      path: 'unlockAvailability',
      message: 'Unavailable or unknown unlocks cannot contain requirements.',
    })
  }
  if (
    (record.unlockAvailability === 'complete' ||
      record.unlockAvailability === 'partial') &&
    (record.unlocks == null ||
      !Array.isArray(record.unlocks.groups) ||
      record.unlocks.groups.length === 0)
  ) {
    issues.push({
      path: 'unlockAvailability',
      message: 'Complete or partial unlock data requires an evidenced condition group.',
    })
  }

  if (
    !includesValue(
      HERO_SKILL_VERIFICATION_STATES,
      record.verificationState,
    )
  ) {
    issues.push({
      path: 'verificationState',
      message: 'Hero Skill verification state is invalid.',
    })
  }
  if (
    !includesValue(
      HERO_SKILL_PUBLICATION_ELIGIBILITY,
      record.publicationEligibility,
    )
  ) {
    issues.push({
      path: 'publicationEligibility',
      message: 'Publication eligibility is invalid.',
    })
  }

  if (!record.source || !isRecord(record.source)) {
    issues.push({ path: 'source', message: 'Source binding is required.' })
  } else {
    if (!isNonEmptyString(record.source.sourceIdentity)) {
      issues.push({
        path: 'source.sourceIdentity',
        message: 'Source identity is required.',
      })
    }
    if (!isNullableString(record.source.sourceVersion)) {
      issues.push({
        path: 'source.sourceVersion',
        message: 'Source version must be text or null.',
      })
    }
    if (!isSha256Digest(record.source.sourceEvidenceDigest)) {
      issues.push({
        path: 'source.sourceEvidenceDigest',
        message: 'Source evidence digest must be a SHA-256 digest.',
      })
    }
    if (!UUID_PATTERN.test(record.source.primaryEvidenceId)) {
      issues.push({
        path: 'source.primaryEvidenceId',
        message: 'Primary evidence ID must be a UUID.',
      })
    }
    if (
      !Array.isArray(record.source.evidenceIds) ||
      record.source.evidenceIds.length === 0 ||
      record.source.evidenceIds.some((id) => !UUID_PATTERN.test(id))
    ) {
      issues.push({
        path: 'source.evidenceIds',
        message: 'At least one source evidence UUID is required.',
      })
    } else if (!record.source.evidenceIds.includes(record.source.primaryEvidenceId)) {
      issues.push({
        path: 'source.primaryEvidenceId',
        message: 'Primary evidence must be included in the evidence set.',
      })
    }

    const childEvidenceIds = [
      ...(Array.isArray(record.progression)
        ? record.progression
            .filter(isRecord)
            .map((level) => level.sourceEvidenceId)
        : []),
      ...(record.unlocks &&
      isRecord(record.unlocks) &&
      Array.isArray(record.unlocks.groups)
        ? record.unlocks.groups
            .filter(isRecord)
            .flatMap((group) =>
              Array.isArray(group.requirements)
                ? group.requirements
                    .filter(isRecord)
                    .map((requirement) => requirement.sourceEvidenceId)
                : [],
            )
        : []),
    ]
    if (
      Array.isArray(record.source.evidenceIds) &&
      childEvidenceIds.some(
        (id) =>
          typeof id === 'string' &&
          !record.source?.evidenceIds.includes(id),
      )
    ) {
      issues.push({
        path: 'source.evidenceIds',
        message: 'Progression and unlock evidence must be included in the source binding.',
      })
    }
  }

  if (!isNullableString(record.reviewedBy)) {
    issues.push({ path: 'reviewedBy', message: 'Reviewer must be text or null.' })
  }
  if (!isNullableTimestamp(record.reviewedAt)) {
    issues.push({
      path: 'reviewedAt',
      message: 'Review timestamp must be a valid date-time or null.',
    })
  }
  if (
    record.verificationState === 'verified' &&
    (!isNonEmptyString(record.reviewedBy) || !isTimestamp(record.reviewedAt))
  ) {
    issues.push({
      path: 'reviewedBy',
      message: 'Verified Hero Skills require reviewer identity and timestamp.',
    })
  }

  if (!isPositiveInteger(record.revision)) {
    issues.push({ path: 'revision', message: 'Revision must be positive.' })
  }
  if (!isNullableString(record.publishedVersionId)) {
    issues.push({
      path: 'publishedVersionId',
      message: 'Published version ID must be text or null.',
    })
  }
  if (!isNullableTimestamp(record.publishedAt)) {
    issues.push({
      path: 'publishedAt',
      message: 'Published timestamp must be a valid date-time or null.',
    })
  }
  if ((record.publishedVersionId === null) !== (record.publishedAt === null)) {
    issues.push({
      path: 'publishedVersionId',
      message: 'Published version and timestamp must be set together.',
    })
  }
  if (!isTimestamp(record.createdAt) || !isTimestamp(record.updatedAt)) {
    issues.push({
      path: 'createdAt',
      message: 'Created and updated timestamps must be valid date-times.',
    })
  }
  if (!isNullableTimestamp(record.withdrawnAt)) {
    issues.push({
      path: 'withdrawnAt',
      message: 'Withdrawal timestamp must be a valid date-time or null.',
    })
  }
  if (!isNullableString(record.withdrawalReason)) {
    issues.push({
      path: 'withdrawalReason',
      message: 'Withdrawal reason must be text or null.',
    })
  }
  if (record.withdrawnAt !== null && !isNonEmptyString(record.withdrawalReason)) {
    issues.push({
      path: 'withdrawalReason',
      message: 'Withdrawn Hero Skills require a reason.',
    })
  }
  if (
    record.verificationState === 'withdrawn' &&
    record.withdrawnAt === null
  ) {
    issues.push({
      path: 'withdrawnAt',
      message: 'Withdrawn Hero Skills require a withdrawal timestamp.',
    })
  }
  if (
    record.verificationState !== 'withdrawn' &&
    (record.withdrawnAt !== null || record.withdrawalReason !== null)
  ) {
    issues.push({
      path: 'verificationState',
      message: 'Withdrawal metadata requires withdrawn verification state.',
    })
  }

  if (
    issues.length === 0 &&
    record.publicationEligibility === 'eligible' &&
    record.source &&
    isRecord(record.source) &&
    Array.isArray(record.progression) &&
    (record.unlocks === null || isRecord(record.unlocks)) &&
    getHeroSkillPublicationBlockers(record as HeroSkillRecord, evidenceRecords)
      .length > 0
  ) {
    issues.push({
      path: 'publicationEligibility',
      message: 'Publication eligibility cannot be eligible while blockers remain.',
    })
  }

  return issues
}

export function validateHeroSkillCollection(
  records: readonly HeroSkillRecord[],
  evidenceRecords: readonly SourceEvidenceRecord[] = [],
): HeroSkillValidationIssue[] {
  const issues: HeroSkillValidationIssue[] = []
  const ids = new Set<string>()
  const identitySeeds = new Set<string>()
  const canonicalSlots = new Set<string>()

  records.forEach((record, index) => {
    for (const issue of validateHeroSkillRecord(record, evidenceRecords)) {
      issues.push({
        path: `records.${index}${issue.path ? `.${issue.path}` : ''}`,
        message: issue.message,
      })
    }

    if (ids.has(record.id)) {
      issues.push({
        path: `records.${index}.id`,
        message: `Hero Skill ID "${record.id}" is duplicated.`,
      })
    }
    if (identitySeeds.has(record.identitySeed)) {
      issues.push({
        path: `records.${index}.identitySeed`,
        message: 'Hero Skill identity seed is duplicated.',
      })
    }

    const slotKey = [
      record.heroId,
      record.category,
      record.slot,
      record.variantKind,
      record.variantIndex,
    ].join(':')
    if (canonicalSlots.has(slotKey) && record.withdrawnAt === null) {
      issues.push({
        path: `records.${index}.slot`,
        message: 'Hero/category/slot/variant combination is duplicated.',
      })
    }

    ids.add(record.id)
    identitySeeds.add(record.identitySeed)
    if (record.withdrawnAt === null) canonicalSlots.add(slotKey)
  })

  return issues
}

export function sortHeroSkills(
  records: readonly HeroSkillRecord[],
): HeroSkillRecord[] {
  return [...records].sort((first, second) => {
    const heroOrder = first.heroId.localeCompare(second.heroId)
    if (heroOrder !== 0) return heroOrder

    const categoryOrder = first.category.localeCompare(second.category)
    if (categoryOrder !== 0) return categoryOrder

    const slotOrder = first.slot - second.slot
    if (slotOrder !== 0) return slotOrder

    const displayOrder = first.displayOrder - second.displayOrder
    if (displayOrder !== 0) return displayOrder

    const variantOrder = first.variantKind.localeCompare(second.variantKind)
    if (variantOrder !== 0) return variantOrder

    const variantIndex = first.variantIndex - second.variantIndex
    if (variantIndex !== 0) return variantIndex

    return first.id.localeCompare(second.id)
  })
}

export function getHeroSkillPublicationBlockers(
  record: HeroSkillRecord,
  evidenceRecords: readonly SourceEvidenceRecord[],
): HeroSkillPublicationBlocker[] {
  const blockers = new Set<HeroSkillPublicationBlocker>()

  if (!isNonEmptyString(record.name)) blockers.add('missing-name')
  if (!isNonEmptyString(record.description)) blockers.add('missing-description')
  if (record.verificationState !== 'verified') blockers.add('unverified-record')
  if (record.withdrawnAt !== null || record.verificationState === 'withdrawn') {
    blockers.add('withdrawn-record')
  }
  if (!isNonEmptyString(record.reviewedBy) || !isTimestamp(record.reviewedAt)) {
    blockers.add('missing-review')
  }

  const primaryEvidence = evidenceRecords.find(
    ({ id }) => id === record.source.primaryEvidenceId,
  )
  if (!primaryEvidence) {
    blockers.add('missing-source-evidence')
  } else {
    if (!canSourceEvidenceSupportCanonical(primaryEvidence)) {
      blockers.add('unapproved-source-evidence')
    }
    if (primaryEvidence.contentDigest !== record.source.sourceEvidenceDigest) {
      blockers.add('source-digest-mismatch')
    }
  }

  for (const evidenceId of record.source.evidenceIds) {
    const evidence = evidenceRecords.find(({ id }) => id === evidenceId)
    if (!evidence) {
      blockers.add('missing-source-evidence')
    } else if (!canSourceEvidenceSupportCanonical(evidence)) {
      blockers.add('unapproved-source-evidence')
    }
  }

  if (
    record.progression.some(
      (level) =>
        level.verificationState !== 'verified' || level.withdrawnAt !== null,
    )
  ) {
    blockers.add('unverified-progression')
  }

  const unlockRequirements =
    record.unlocks?.groups.flatMap((group) => group.requirements) ?? []
  if (
    unlockRequirements.some(
      (requirement) =>
        requirement.verificationState !== 'verified' ||
        requirement.withdrawnAt !== null,
    )
  ) {
    blockers.add('unverified-unlock')
  }

  return [...blockers]
}

export function toPublicHeroSkillProjection(
  record: HeroSkillRecord,
  evidenceRecords: readonly SourceEvidenceRecord[],
): PublicHeroSkillProjection | null {
  if (
    record.publicationEligibility !== 'eligible' ||
    getHeroSkillPublicationBlockers(record, evidenceRecords).length > 0
  ) {
    return null
  }

  const primaryEvidence = evidenceRecords.find(
    ({ id }) => id === record.source.primaryEvidenceId,
  )
  if (!primaryEvidence || !record.publishedVersionId || !record.publishedAt) {
    return null
  }

  return {
    id: record.id,
    heroId: record.heroId,
    name: record.name,
    category: record.category,
    slot: record.slot,
    displayOrder: record.displayOrder,
    description: record.description,
    maxLevel: record.maxLevel,
    progressionAvailability: record.progressionAvailability,
    progression: record.progression
      .filter(
        (level) =>
          level.verificationState === 'verified' && level.withdrawnAt === null,
      )
      .map((level) => ({
        level: level.level,
        canonicalText: level.canonicalText,
        effects: level.effects,
        displayOrder: level.displayOrder,
      })),
    unlockAvailability: record.unlockAvailability,
    unlockOperator: record.unlocks?.operator ?? null,
    unlockGroups:
      record.unlocks?.groups.map((group) => ({
        operator: group.operator,
        order: group.order,
        requirements: group.requirements
          .filter(
            (requirement) =>
              requirement.verificationState === 'verified' &&
              requirement.withdrawnAt === null,
          )
          .map((requirement) => ({
            type: requirement.type,
            operator: requirement.operator,
            value: requirement.value,
            relatedDomainId: requirement.relatedDomainId,
            displayFallback: requirement.displayFallback,
            order: requirement.order,
          })),
      })) ?? [],
    source: toPublicSourceSummary(primaryEvidence),
    publishedVersionId: record.publishedVersionId,
    publishedAt: record.publishedAt,
  }
}
