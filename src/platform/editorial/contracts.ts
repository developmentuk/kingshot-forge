import type {
  DatasetPublicationStatus,
  DatasetRecordSource,
  DatasetRecordValues,
} from '../datasets'

export type EditorialAction =
  | 'draft_created'
  | 'draft_saved'
  | 'submitted_for_review'
  | 'returned_to_draft'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived'
  | 'restored'
  | 'rolled_back'

export interface EditorialRecordVersion<
  TValues extends DatasetRecordValues = DatasetRecordValues,
> {
  id: string
  datasetId: string
  recordId: string
  version: number
  status: DatasetPublicationStatus
  values: TValues
  source?: DatasetRecordSource
  createdAt: string
  createdBy: string
  note?: string
}

export interface EditorialRecordHead {
  datasetId: string
  recordId: string
  currentVersion: number
  currentVersionId: string
  status: DatasetPublicationStatus
  updatedAt: string
  updatedBy: string
}

export interface EditorialAuditEvent {
  id: string
  datasetId: string
  recordId: string
  versionId: string
  action: EditorialAction
  actorId: string
  occurredAt: string
  fromStatus?: DatasetPublicationStatus
  toStatus: DatasetPublicationStatus
  note?: string
  metadata?: Record<string, unknown>
}

export interface EditorialDraftInput<
  TValues extends DatasetRecordValues = DatasetRecordValues,
> {
  datasetId: string
  recordId: string
  values: TValues
  actorId: string
  expectedVersion: number | null
  source?: DatasetRecordSource
  note?: string
}

export interface EditorialDraftSaveResult<
  TValues extends DatasetRecordValues = DatasetRecordValues,
> {
  head: EditorialRecordHead
  version: EditorialRecordVersion<TValues>
  auditEvent: EditorialAuditEvent
}

export class EditorialConcurrencyError extends Error {
  readonly datasetId: string
  readonly recordId: string
  readonly expectedVersion: number | null
  readonly actualVersion: number | null

  constructor(
    datasetId: string,
    recordId: string,
    expectedVersion: number | null,
    actualVersion: number | null,
  ) {
    super(
      `Editorial record "${datasetId}/${recordId}" changed from version ` +
        `${String(expectedVersion)} to ${String(actualVersion)}.`,
    )
    this.name = 'EditorialConcurrencyError'
    this.datasetId = datasetId
    this.recordId = recordId
    this.expectedVersion = expectedVersion
    this.actualVersion = actualVersion
  }
}
