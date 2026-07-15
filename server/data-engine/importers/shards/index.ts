import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types'

import type {
  NormalisedShardRecord,
  ShardRaritySourceRecord,
  ShardsSourcePayload,
} from './types'

const SHARDS_SOURCE_URL =
  'https://kingshotpro.com/data/shards.json'

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
): ShardsSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'Shards source payload must be a JSON object.',
    )
  }

  if (!isObject(payload.shardCosts)) {
    throw new Error(
      'Shards source payload must contain a shardCosts object.',
    )
  }

  return {
    _meta: payload._meta,
    shardCosts: payload.shardCosts,
  }
}

function normaliseTier(
  rarityKey: string,
  rarityValue: unknown,
  tierValue: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedShardRecord {
  if (!isObject(rarityValue)) {
    throw new Error(
      `Shard rarity "${rarityKey}" must be a JSON object.`,
    )
  }

  if (
    !Array.isArray(tierValue) ||
    tierValue.length < 2
  ) {
    throw new Error(
      `Shard tier for "${rarityKey}" must be a two-item array.`,
    )
  }

  const rarity =
    rarityValue as ShardRaritySourceRecord

  const label =
    readString(rarity.label) ??
    `${rarityKey} Hero Shards`

  const starLevel =
    readNumber(tierValue[0])

  const shardsRequired =
    readNumber(tierValue[1])

  if (
    starLevel === null ||
    !Number.isInteger(starLevel) ||
    starLevel < 1
  ) {
    throw new Error(
      `Shard rarity "${rarityKey}" contains an invalid star level.`,
    )
  }

  if (
    shardsRequired === null ||
    shardsRequired < 0
  ) {
    throw new Error(
      `Shard rarity "${rarityKey}" star ${starLevel} contains an invalid shard cost.`,
    )
  }

  const raritySlug = createSlug(rarityKey)

  return {
    key:
      `${raritySlug}-star-${starLevel}`,

    rarity: raritySlug,
    label,

    star_level: starLevel,

    shards_required: shardsRequired,

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
      SHARDS_SOURCE_URL,
  }
}

function normalisePayload(
  payload: ShardsSourcePayload,
): NormalisedDataset<NormalisedShardRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records: NormalisedShardRecord[] = []

  for (
    const [
      rarityKey,
      rarityValue,
    ] of Object.entries(payload.shardCosts)
  ) {
    if (!isObject(rarityValue)) {
      throw new Error(
        `Shard rarity "${rarityKey}" must be a JSON object.`,
      )
    }

    if (!Array.isArray(rarityValue.tiers)) {
      throw new Error(
        `Shard rarity "${rarityKey}" must contain a tiers array.`,
      )
    }

    for (const tier of rarityValue.tiers) {
      records.push(
        normaliseTier(
          rarityKey,
          rarityValue,
          tier,
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

export const shardsImporter:
  DatasetImporter<
    ShardsSourcePayload,
    NormalisedShardRecord
  > = {
    key: 'shards',

    sourceUrl: SHARDS_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }