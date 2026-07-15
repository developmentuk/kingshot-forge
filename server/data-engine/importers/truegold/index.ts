import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types'

import type {
  NormalisedTruegoldRecord,
  TemperedTruegoldTierValues,
  TruegoldBuildingSourceRecord,
  TruegoldSourcePayload,
  TruegoldTierValues,
} from './types'

const TRUEGOLD_SOURCE_URL =
  'https://kingshotpro.com/data/truegold.json'

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

function createKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
): TruegoldSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'Truegold source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.buildings)) {
    throw new Error(
      'Truegold source payload must contain a buildings array.',
    )
  }

  return {
    _meta: payload._meta,
    buildings: payload.buildings,
  }
}

function normaliseBuilding(
  value: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedTruegoldRecord {
  if (!isObject(value)) {
    throw new Error(
      'Truegold building record must be a JSON object.',
    )
  }

  const record =
    value as TruegoldBuildingSourceRecord

  const building = readString(record.building)

  if (!building) {
    throw new Error(
      'Truegold building record is missing a valid building name.',
    )
  }

  const truegold = isObject(record.truegold)
    ? record.truegold as TruegoldTierValues
    : {}

  const temperedSource =
    record.temperedTruegold ??
    record.tempered_truegold

  const tempered = isObject(temperedSource)
    ? temperedSource as TemperedTruegoldTierValues
    : {}

  return {
    key: createKey(building),
    building,

    truegold_tg1:
      readNumber(truegold.tg1),

    truegold_tg2:
      readNumber(truegold.tg2),

    truegold_tg3:
      readNumber(truegold.tg3),

    truegold_tg4:
      readNumber(truegold.tg4),

    truegold_tg5:
      readNumber(truegold.tg5),

    truegold_tg6:
      readNumber(truegold.tg6),

    truegold_tg7:
      readNumber(truegold.tg7),

    truegold_tg8:
      readNumber(truegold.tg8),

    tempered_truegold_tg6:
      readNumber(tempered.tg6),

    tempered_truegold_tg7:
      readNumber(tempered.tg7),

    tempered_truegold_tg8:
      readNumber(tempered.tg8),

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
      TRUEGOLD_SOURCE_URL,
  }
}

function normalisePayload(
  payload: TruegoldSourcePayload,
): NormalisedDataset<NormalisedTruegoldRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records =
    payload.buildings.map((building) =>
      normaliseBuilding(
        building,
        metadata,
      ),
    )

  return {
    metadata,
    records,
  }
}

export const truegoldImporter:
  DatasetImporter<
    TruegoldSourcePayload,
    NormalisedTruegoldRecord
  > = {
    key: 'truegold',

    sourceUrl: TRUEGOLD_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }