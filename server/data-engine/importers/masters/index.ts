import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types'

import type {
  MasterSourceRecord,
  MastersSourcePayload,
  NormalisedMasterRecord,
} from './types'

const MASTERS_SOURCE_URL =
  'https://kingshotpro.com/data/masters.json'

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

function readStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string',
    )
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function createSlug(value: string): string {
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
): MastersSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'Masters source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.masters)) {
    throw new Error(
      'Masters source payload must contain a masters array.',
    )
  }

  return {
    _meta: payload._meta,
    masters: payload.masters,
  }
}

function normaliseMaster(
  value: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedMasterRecord {
  if (!isObject(value)) {
    throw new Error(
      'Master record must be a JSON object.',
    )
  }

  const record =
    value as MasterSourceRecord

  const name =
    readString(record.name)

  if (!name) {
    throw new Error(
      'Master record is missing a valid name.',
    )
  }

  const role =
    readString(record.role)

  if (!role) {
    throw new Error(
      `Master "${name}" is missing a role.`,
    )
  }

  const key = createSlug(name)

  if (!key) {
    throw new Error(
      `Unable to create a key for Master "${name}".`,
    )
  }

  return {
    key,
    name,

    generation:
      readNumber(
        record.gen,
        record.generation,
      ),

    role,

    passive:
      readString(record.passive),

    skills:
      readStringArray(record.skills),

    total_power:
      readNumber(
        record.total_power,
        record.totalPower,
      ),

    manuscripts:
      readNumber(record.manuscripts),

    unlock_order:
      readNumber(
        record.unlock_order,
        record.unlockOrder,
      ),

    confidence:
      readNumber(record.confidence),

    confidence_note:
      readString(
        record.confidence_note,
        record.confidenceNote,
      ),

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
      MASTERS_SOURCE_URL,
  }
}

function normalisePayload(
  payload: MastersSourcePayload,
): NormalisedDataset<NormalisedMasterRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records =
    payload.masters.map((master) =>
      normaliseMaster(
        master,
        metadata,
      ),
    )

  return {
    metadata,
    records,
  }
}

export const mastersImporter:
  DatasetImporter<
    MastersSourcePayload,
    NormalisedMasterRecord
  > = {
    key: 'masters',

    sourceUrl: MASTERS_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }