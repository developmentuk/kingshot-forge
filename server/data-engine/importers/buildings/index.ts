import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types'

import type {
  BuildingSourcePayload,
  BuildingSourceRecord,
  NormalisedBuildingRecord,
} from './types'

const BUILDINGS_SOURCE_URL =
  'https://kingshotpro.com/data/buildings.json'

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

function readCosts(
  value: unknown,
): unknown[][] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (row): row is unknown[] =>
      Array.isArray(row),
  )
}

function parseMetadata(
  value: unknown,
): DatasetSourceMetadata | null {
  if (!isObject(value)) {
    return null
  }

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
      readString(value.verified) ?? undefined,

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
): BuildingSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'Buildings source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.buildings)) {
    throw new Error(
      'Buildings source payload must contain a buildings array.',
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
): NormalisedBuildingRecord {
  if (!isObject(value)) {
    throw new Error(
      'Building record must be a JSON object.',
    )
  }

  const building =
    value as BuildingSourceRecord

  const name = readString(building.name)

  if (!name) {
    throw new Error(
      'Building record is missing a valid name.',
    )
  }

  const suppliedKey =
    readString(building.key)

  const key = suppliedKey
    ? createKey(suppliedKey)
    : createKey(name)

  if (!key) {
    throw new Error(
      `Unable to create a key for building "${name}".`,
    )
  }

  return {
    key,
    name,

    max_level:
      readNumber(
        building.maxLevel,
        building.max_level,
      ),

    source:
      readString(building.source),

    note:
      readString(building.note),

    costs:
      readCosts(building.costs),

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
      BUILDINGS_SOURCE_URL,
  }
}

function normalisePayload(
  payload: BuildingSourcePayload,
): NormalisedDataset<NormalisedBuildingRecord> {
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

export const buildingsImporter:
  DatasetImporter<
    BuildingSourcePayload,
    NormalisedBuildingRecord
  > = {
    key: 'buildings',

    sourceUrl: BUILDINGS_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }