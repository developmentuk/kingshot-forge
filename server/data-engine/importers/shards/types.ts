export interface ShardTierSourceRecord
  extends Array<unknown> {
  0: unknown
  1: unknown
}

export interface ShardRaritySourceRecord {
  label?: unknown
  tiers?: unknown
}

export interface ShardsSourcePayload {
  _meta?: unknown
  shardCosts: Record<string, unknown>
}

export interface NormalisedShardRecord {
  key: string
  rarity: string
  label: string
  star_level: number
  shards_required: number

  is_active: boolean

  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string
  source_url: string
}