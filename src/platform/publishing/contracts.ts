export type PublicationQueueStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface PublicationQueueItem {
  id: string
  datasetId: string
  recordId: string
  versionId: string
  expectedVersion: number
  requestedBy: string
  requestedAt: string
  status: PublicationQueueStatus
  attempts: number
  lastAttemptAt?: string
  completedAt?: string
  cancelledAt?: string
  failureMessage?: string
  note?: string
  metadata?: Record<string, unknown>
}

export interface EnqueuePublicationInput {
  datasetId: string
  recordId: string
  versionId: string
  expectedVersion: number
  requestedBy: string
  note?: string
  metadata?: Record<string, unknown>
}

export interface PublicationQueueFilter {
  datasetId?: string
  recordId?: string
  requestedBy?: string
  status?: PublicationQueueStatus
}

export interface PublicationExecutionContext {
  item: PublicationQueueItem
}

export interface PublicationExecutionResult {
  publishedVersionId: string
  queueOutcomeCommitted?: boolean
  metadata?: Record<string, unknown>
}

export type PublicationExecutor = (
  context: PublicationExecutionContext,
) => Promise<PublicationExecutionResult>

export interface PublicationQueueServiceOptions {
  now?: () => string
  createId?: () => string
  maximumAttempts?: number
}

export class PublicationQueueError extends Error {
  readonly itemId?: string

  constructor(
    message: string,
    itemId?: string,
  ) {
    super(message)
    this.name = 'PublicationQueueError'
    this.itemId = itemId
  }
}
