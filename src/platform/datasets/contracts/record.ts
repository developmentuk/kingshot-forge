import type { DatasetRecordValues } from './value'
import type { DatasetPublicationStatus } from './publishing'

export interface DatasetRecordSource {
  name?: string
  url?: string
  canonicalUrl?: string
  importedAt?: string
  sourceUpdatedAt?: string
  verifiedAt?: string
  accuracyScore?: number
  checksum?: string
  metadata?: Record<string, unknown>
}

export interface DatasetRecordAuditMetadata {
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  publishedAt: string | null
  publishedBy: string | null
}

export interface DatasetRecord<TValues extends DatasetRecordValues = DatasetRecordValues> {
  id: string
  datasetId: string
  version: number
  status: DatasetPublicationStatus
  values: TValues
  audit: DatasetRecordAuditMetadata
  source?: DatasetRecordSource
}

export interface DatasetRecordDraft<TValues extends DatasetRecordValues = DatasetRecordValues> {
  id: string | null
  datasetId: string
  baseVersion: number | null
  values: TValues
}
