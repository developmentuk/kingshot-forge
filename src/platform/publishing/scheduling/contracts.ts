import type {
  EnqueuePublicationInput,
  PublicationQueueItem,
} from '../contracts'

export type ScheduledPublicationStatus =
  | 'scheduled'
  | 'queued'
  | 'cancelled'
  | 'failed'

export interface ScheduledPublication {
  id: string
  publication: EnqueuePublicationInput
  scheduledFor: string
  createdAt: string
  createdBy: string
  status: ScheduledPublicationStatus
  queuedAt?: string
  queueItemId?: string
  cancelledAt?: string
  failureMessage?: string
  metadata?: Record<string, unknown>
}

export interface SchedulePublicationInput {
  publication: EnqueuePublicationInput
  scheduledFor: string
  createdBy: string
  metadata?: Record<string, unknown>
}

export interface ScheduledPublicationFilter {
  datasetId?: string
  recordId?: string
  createdBy?: string
  status?: ScheduledPublicationStatus
  dueBefore?: string
}

export interface ScheduledPublicationRunResult {
  schedule: ScheduledPublication
  queueItem?: PublicationQueueItem
}

export interface ScheduledPublishingServiceOptions {
  now?: () => string
  createId?: () => string
}

export class ScheduledPublicationError extends Error {
  readonly scheduleId?: string

  constructor(
    message: string,
    scheduleId?: string,
  ) {
    super(message)
    this.name = 'ScheduledPublicationError'
    this.scheduleId = scheduleId
  }
}
