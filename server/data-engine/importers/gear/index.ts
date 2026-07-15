import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types'

import type {
  GearBonusesSourceRecord,
  GearMaterialsSourceRecord,
  GearSourcePayload,
  GearUpgradeStepSourceRecord,
  NormalisedGearRecord,
} from './types'

const GEAR_SOURCE_URL =
  'https://kingshotpro.com/data/gear.json'

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

function readPercentage(
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
      const parsed = Number(
        value.replace('%', '').trim(),
      )

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function createKey(
  tier: string,
  stars: number,
): string {
  const tierKey = tier
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${tierKey}-${stars}-star`
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
      readNumber(value.accuracyScore) ??
      undefined,

    license:
      readString(value.license) ?? undefined,

    provenance: value.provenance,
  }
}

function parsePayload(
  payload: unknown,
): GearSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'Gear source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.upgradeSteps)) {
    throw new Error(
      'Gear source payload must contain an upgradeSteps array.',
    )
  }

  return {
    _meta: payload._meta,
    upgradeSteps: payload.upgradeSteps,
  }
}

function normaliseGearStep(
  value: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedGearRecord {
  if (!isObject(value)) {
    throw new Error(
      'Gear upgrade step must be a JSON object.',
    )
  }

  const step =
    value as GearUpgradeStepSourceRecord

  const tier = readString(step.tier)

  if (!tier) {
    throw new Error(
      'Gear upgrade step is missing a valid tier.',
    )
  }

  const stars = readNumber(step.stars)

  if (stars === null) {
    throw new Error(
      `Gear tier "${tier}" is missing a valid star value.`,
    )
  }

  const materials = isObject(step.materials)
    ? step.materials as GearMaterialsSourceRecord
    : {}

  const bonuses = isObject(step.bonuses)
    ? step.bonuses as GearBonusesSourceRecord
    : {}

  return {
    key: createKey(tier, stars),

    tier,
    stars,

    satin:
      readNumber(materials.satin),

    gilded_threads:
      readNumber(materials.gilded_threads),

    artisans_vision:
      readNumber(materials.artisans_vision),

    attack_bonus:
      readPercentage(bonuses.attack),

    defense_bonus:
      readPercentage(bonuses.defense),

    power_total:
      readNumber(step.power_total),

    confidence:
      readNumber(step.confidence),

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
      GEAR_SOURCE_URL,
  }
}

function normalisePayload(
  payload: GearSourcePayload,
): NormalisedDataset<NormalisedGearRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records =
    payload.upgradeSteps.map((step) =>
      normaliseGearStep(
        step,
        metadata,
      ),
    )

  return {
    metadata,
    records,
  }
}

export const gearImporter:
  DatasetImporter<
    GearSourcePayload,
    NormalisedGearRecord
  > = {
    key: 'gear',

    sourceUrl: GEAR_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }