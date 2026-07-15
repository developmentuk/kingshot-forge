import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types'

import type {
  CharmLevelSourceRecord,
  CharmSourcePayload,
  NormalisedCharmRecord,
} from './types'

const CHARM_SOURCE_URL =
  'https://kingshotpro.com/data/charm.json'

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
): CharmSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'Charm source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.charmLevels)) {
    throw new Error(
      'Charm source payload must contain a charmLevels array.',
    )
  }

  return {
    _meta: payload._meta,
    charmLevels: payload.charmLevels,
  }
}

function normaliseCharmLevel(
  value: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedCharmRecord {
  if (!isObject(value)) {
    throw new Error(
      'Charm level record must be a JSON object.',
    )
  }

  const record =
    value as CharmLevelSourceRecord

  const level =
    readNumber(record.level)

  if (
    level === null ||
    !Number.isInteger(level) ||
    level < 1
  ) {
    throw new Error(
      'Charm level record is missing a valid level.',
    )
  }

  const charmGuides =
    readNumber(
      record.charmGuides,
      record.charm_guides,
    )

  if (charmGuides === null) {
    throw new Error(
      `Charm level ${level} is missing charmGuides.`,
    )
  }

  const charmDesigns =
    readNumber(
      record.charmDesigns,
      record.charm_designs,
    )

  if (charmDesigns === null) {
    throw new Error(
      `Charm level ${level} is missing charmDesigns.`,
    )
  }

  const statIncreasePct =
    readNumber(
      record.statIncreasePct,
      record.stat_increase_pct,
    )

  if (statIncreasePct === null) {
    throw new Error(
      `Charm level ${level} is missing statIncreasePct.`,
    )
  }

  const powerGained =
    readNumber(
      record.powerGained,
      record.power_gained,
    )

  if (powerGained === null) {
    throw new Error(
      `Charm level ${level} is missing powerGained.`,
    )
  }

  return {
    key: `charm-level-${level}`,
    level,

    charm_guides: charmGuides,
    charm_designs: charmDesigns,
    stat_increase_pct: statIncreasePct,
    power_gained: powerGained,

    confidence:
      readNumber(record.confidence),

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
      CHARM_SOURCE_URL,
  }
}

function normalisePayload(
  payload: CharmSourcePayload,
): NormalisedDataset<NormalisedCharmRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records =
    payload.charmLevels.map((level) =>
      normaliseCharmLevel(
        level,
        metadata,
      ),
    )

  return {
    metadata,
    records,
  }
}

export const charmImporter:
  DatasetImporter<
    CharmSourcePayload,
    NormalisedCharmRecord
  > = {
    key: 'charm',

    sourceUrl: CHARM_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }