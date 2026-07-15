import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types'

import type {
  NormalisedTroopRecord,
  TroopPointsSourceRecord,
  TroopSourcePayload,
  TroopTierSourceRecord,
  TroopTypeSourceRecord,
} from './types'

const TROOPS_SOURCE_URL =
  'https://kingshotpro.com/data/troops.json'

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
      readString(value.verified) ?? undefined,

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
): TroopSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'Troops source payload must be a JSON object.',
    )
  }

  if (!isObject(payload.troops)) {
    throw new Error(
      'Troops source payload must contain a troops object.',
    )
  }

  return {
    _meta: payload._meta,
    troops: payload.troops,
  }
}

function readTierNumber(
  tierKey: string,
): number | null {
  const match = /^t(\d+)$/i.exec(tierKey)

  if (!match) {
    return null
  }

  const tier = Number(match[1])

  return Number.isFinite(tier)
    ? tier
    : null
}

function normaliseTier(
  troopTypeKey: string,
  troopTypeValue: unknown,
  tierKey: string,
  tierValue: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedTroopRecord {
  if (!isObject(troopTypeValue)) {
    throw new Error(
      `Troop type "${troopTypeKey}" must be a JSON object.`,
    )
  }

  if (!isObject(tierValue)) {
    throw new Error(
      `Troop tier "${troopTypeKey}.${tierKey}" must be a JSON object.`,
    )
  }

  const troopType =
    troopTypeValue as TroopTypeSourceRecord

  const tierRecord =
    tierValue as TroopTierSourceRecord

  const tier = readTierNumber(tierKey)

  if (tier === null) {
    throw new Error(
      `Unable to read troop tier from "${tierKey}".`,
    )
  }

  const troopName =
    readString(troopType.name) ??
    troopTypeKey

  const label =
    readString(tierRecord.label) ??
    `T${tier} ${troopName}`

  const points = isObject(tierRecord.pts)
    ? tierRecord.pts as TroopPointsSourceRecord
    : {}

  return {
    key: createKey(
      `${troopTypeKey}-${tierKey}`,
    ),

    troop_type:
      createKey(troopTypeKey),

    troop_name: troopName,

    tier,
    label,

    food:
      readNumber(tierRecord.food),

    wood:
      readNumber(tierRecord.wood),

    stone:
      readNumber(tierRecord.stone),

    iron:
      readNumber(tierRecord.iron),

    time_seconds:
      readNumber(
        tierRecord.timeSec,
        tierRecord.time_sec,
      ),

    points_hog:
      readNumber(points.hog),

    points_kvk:
      readNumber(points.kvk),

    points_tsg:
      readNumber(points.tsg),

    status:
      readString(tierRecord.status),

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
      TROOPS_SOURCE_URL,
  }
}

function normalisePayload(
  payload: TroopSourcePayload,
): NormalisedDataset<NormalisedTroopRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records: NormalisedTroopRecord[] = []

  for (
    const [
      troopTypeKey,
      troopTypeValue,
    ] of Object.entries(payload.troops)
  ) {
    if (!isObject(troopTypeValue)) {
      throw new Error(
        `Troop type "${troopTypeKey}" must be a JSON object.`,
      )
    }

    const tiers = troopTypeValue.tiers

    if (!isObject(tiers)) {
      throw new Error(
        `Troop type "${troopTypeKey}" must contain a tiers object.`,
      )
    }

    for (
      const [tierKey, tierValue]
      of Object.entries(tiers)
    ) {
      records.push(
        normaliseTier(
          troopTypeKey,
          troopTypeValue,
          tierKey,
          tierValue,
          metadata,
        ),
      )
    }
  }

  return {
    metadata,
    records,
  }
}

export const troopsImporter:
  DatasetImporter<
    TroopSourcePayload,
    NormalisedTroopRecord
  > = {
    key: 'troops',

    sourceUrl: TROOPS_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }