import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types'

import type {
  HeroXpLevelSourceRecord,
  HeroXpSourcePayload,
  NormalisedHeroXpRecord,
} from './types'

const HERO_XP_SOURCE_URL =
  'https://kingshotpro.com/data/hero-xp.json'

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function readString(
  ...values: unknown[]
): string | null {
  for (const value of values) {
    if (
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      return value.trim()
    }
  }

  return null
}

function readNumber(
  ...values: unknown[]
): number | null {
  for (const value of values) {
    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value
    }

    if (
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function parseMetadata(
  value: unknown,
): DatasetSourceMetadata | null {
  if (!isObject(value)) {
    return null
  }

  const provenance = isObject(value.provenance)
    ? value.provenance
    : null

  return {
    dataset:
      readString(value.dataset) ?? undefined,

    title:
      readString(value.title) ?? undefined,

    description:
      readString(value.description) ??
      undefined,

    canonical:
      readString(value.canonical) ??
      undefined,

    updated:
      readString(value.updated) ?? undefined,

    verified:
      readString(
        value.verified,
        provenance?.verified,
      ) ?? undefined,

    accuracyScore:
      readNumber(
        value.accuracyScore,
        provenance?.accuracyScore,
      ) ?? undefined,

    license:
      readString(value.license) ?? undefined,

    provenance: value.provenance,
  }
}

function parsePayload(
  payload: unknown,
): HeroXpSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'Hero XP source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.heroXp)) {
    throw new Error(
      'Hero XP source payload must contain a heroXp array.',
    )
  }

  return {
    _meta: payload._meta,
    heroXp: payload.heroXp,
  }
}

function normaliseHeroXpLevel(
  value: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedHeroXpRecord {
  if (!isObject(value)) {
    throw new Error(
      'Hero XP level record must be a JSON object.',
    )
  }

  const record =
    value as HeroXpLevelSourceRecord

  const level =
    readNumber(record.level)

  if (
    level === null ||
    !Number.isInteger(level) ||
    level < 1
  ) {
    throw new Error(
      'Hero XP record is missing a valid level.',
    )
  }

  const xpToReach =
    readNumber(
      record.xpToReach,
      record.xp_to_reach,
    )

  if (xpToReach === null) {
    throw new Error(
      `Hero level ${level} is missing xpToReach.`,
    )
  }

  const deploymentCapacity =
    readNumber(
      record.deploymentCapacity,
      record.deployment_capacity,
    )

  if (deploymentCapacity === null) {
    throw new Error(
      `Hero level ${level} is missing deploymentCapacity.`,
    )
  }

  return {
    key: `hero-level-${level}`,

    level,

    xp_to_reach: xpToReach,

    deployment_capacity:
      deploymentCapacity,

    is_active: true,

    source_updated_at:
      metadata?.updated ?? null,

    source_verified:
      metadata?.verified ?? null,

    source_accuracy_score:
      metadata?.accuracyScore ?? null,

    source_name: 'KingshotPro',

    source_url:
      metadata?.canonical ??
      HERO_XP_SOURCE_URL,
  }
}

function normalisePayload(
  payload: HeroXpSourcePayload,
): NormalisedDataset<NormalisedHeroXpRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records =
    payload.heroXp.map((level) =>
      normaliseHeroXpLevel(
        level,
        metadata,
      ),
    )

  return {
    metadata,
    records,
  }
}

export const heroXpImporter:
  DatasetImporter<
    HeroXpSourcePayload,
    NormalisedHeroXpRecord
  > = {
    key: 'hero-xp',

    sourceUrl: HERO_XP_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }