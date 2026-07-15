import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types.js'

import type {
  KvkActionSourceRecord,
  KvkDaySourceRecord,
  KvkSourcePayload,
  NormalisedKvkRecord,
} from './types.js'

const KVK_SOURCE_URL =
  'https://kingshotpro.com/data/kvk.json'

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
): KvkSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'KvK source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.days)) {
    throw new Error(
      'KvK source payload must contain a days array.',
    )
  }

  return {
    _meta: payload._meta,
    days: payload.days,
  }
}

function normaliseAction(
  dayValue: unknown,
  actionValue: unknown,
  actionIndex: number,
  metadata: DatasetSourceMetadata | null,
): NormalisedKvkRecord {
  if (!isObject(dayValue)) {
    throw new Error(
      'KvK day must be a JSON object.',
    )
  }

  if (!isObject(actionValue)) {
    throw new Error(
      'KvK action must be a JSON object.',
    )
  }

  const dayRecord =
    dayValue as KvkDaySourceRecord

  const actionRecord =
    actionValue as KvkActionSourceRecord

  const day =
    readNumber(dayRecord.day)

  if (
    day === null ||
    !Number.isInteger(day) ||
    day < 1
  ) {
    throw new Error(
      'KvK day is missing a valid day number.',
    )
  }

  const dayName =
    readString(dayRecord.name)

  if (!dayName) {
    throw new Error(
      `KvK day ${day} is missing a valid name.`,
    )
  }

  const actionLabel =
    readString(actionRecord.label)

  if (!actionLabel) {
    throw new Error(
      `KvK day ${day} contains an action without a valid label.`,
    )
  }

  const unit =
    readString(actionRecord.unit)

  if (!unit) {
    throw new Error(
      `KvK action "${actionLabel}" is missing a unit.`,
    )
  }

  const points =
    readNumber(
      actionRecord.pts,
      actionRecord.points,
    )

  if (points === null) {
    throw new Error(
      `KvK action "${actionLabel}" is missing a points value.`,
    )
  }

  const actionSlug =
    createSlug(actionLabel)

  return {
    key:
      `day-${day}-${actionIndex + 1}-${actionSlug}`,

    day,
    day_name: dayName,

    action_label: actionLabel,
    unit,
    points,

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
      KVK_SOURCE_URL,
  }
}

function normalisePayload(
  payload: KvkSourcePayload,
): NormalisedDataset<NormalisedKvkRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records: NormalisedKvkRecord[] = []

  for (const day of payload.days) {
    if (!isObject(day)) {
      throw new Error(
        'KvK day must be a JSON object.',
      )
    }

    if (!Array.isArray(day.actions)) {
      throw new Error(
        'KvK day must contain an actions array.',
      )
    }

    day.actions.forEach(
      (action, actionIndex) => {
        records.push(
          normaliseAction(
            day,
            action,
            actionIndex,
            metadata,
          ),
        )
      },
    )
  }

  return {
    metadata,
    records,
  }
}

export const kvkImporter:
  DatasetImporter<
    KvkSourcePayload,
    NormalisedKvkRecord
  > = {
    key: 'kvk',

    sourceUrl: KVK_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }