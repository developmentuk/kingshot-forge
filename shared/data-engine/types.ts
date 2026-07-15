import type { DatasetKey } from './datasets.js'

export type { DatasetKey } from './datasets.js'


export type ImportTrigger =
  | 'manual'
  | 'scheduled'
  | 'deployment'
  | 'system'

export type ImportRunStatus =
  | 'running'
  | 'succeeded'
  | 'unchanged'
  | 'failed'
  | 'rejected'

export interface DatasetSourceMetadata {
  dataset?: string
  title?: string
  description?: string
  canonical?: string
  updated?: string
  verified?: string
  accuracyScore?: number
  license?: string
  provenance?: unknown
}

export interface SourceFetchResult<TPayload> {
  sourceUrl: string
  fetchedAt: string
  httpStatus: number
  payload: TPayload
  payloadHash: string
}

export interface ImportCounts {
  received: number
  inserted: number
  updated: number
  unchanged: number
  deactivated: number
  invalid: number
}

export interface ImportResult {
  dataset: DatasetKey
  status: ImportRunStatus
  startedAt: string
  completedAt: string
  sourceUrl: string
  sourceUpdatedAt: string | null
  payloadHash: string | null
  counts: ImportCounts
  message: string
}

export interface NormalisedDataset<TRecord> {
  metadata: DatasetSourceMetadata | null
  records: TRecord[]
}

export interface DatasetImporter<TPayload, TRecord> {
  readonly key: DatasetKey
  readonly sourceUrl: string

  parsePayload(payload: unknown): TPayload

  normalisePayload(
    payload: TPayload,
  ): NormalisedDataset<TRecord>

  getRecordKey(record: TRecord): string
}
