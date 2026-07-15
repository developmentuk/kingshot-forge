import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types'

import type {
  NormalisedVipRecord,
  VipLevelSourceRecord,
  VipSourcePayload,
} from './types'

const VIP_SOURCE_URL =
  'https://kingshotpro.com/data/vip.json'

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
): VipSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'VIP source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.vipLevels)) {
    throw new Error(
      'VIP source payload must contain a vipLevels array.',
    )
  }

  return {
    _meta: payload._meta,
    vipLevels: payload.vipLevels,
  }
}

function normaliseVipLevel(
  value: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedVipRecord {
  if (!isObject(value)) {
    throw new Error(
      'VIP level record must be a JSON object.',
    )
  }

  const record =
    value as VipLevelSourceRecord

  const level =
    readNumber(record.level)

  if (
    level === null ||
    !Number.isInteger(level) ||
    level < 1
  ) {
    throw new Error(
      'VIP level record is missing a valid level.',
    )
  }

  const xpToReach =
    readNumber(
      record.xpToReach,
      record.xp_to_reach,
    )

  if (xpToReach === null) {
    throw new Error(
      `VIP level ${level} is missing xpToReach.`,
    )
  }

  const gemsEquivalent =
    readNumber(
      record.gemsEquivalent,
      record.gems_equivalent,
    )

  if (gemsEquivalent === null) {
    throw new Error(
      `VIP level ${level} is missing gemsEquivalent.`,
    )
  }

  return {
    key: `vip-${level}`,

    level,

    xp_to_reach: xpToReach,

    gems_equivalent: gemsEquivalent,

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
      VIP_SOURCE_URL,
  }
}

function normalisePayload(
  payload: VipSourcePayload,
): NormalisedDataset<NormalisedVipRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records =
    payload.vipLevels.map((level) =>
      normaliseVipLevel(
        level,
        metadata,
      ),
    )

  return {
    metadata,
    records,
  }
}

export const vipImporter:
  DatasetImporter<
    VipSourcePayload,
    NormalisedVipRecord
  > = {
    key: 'vip',

    sourceUrl: VIP_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }