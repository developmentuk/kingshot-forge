import type {
  DatasetPublicationStatus,
  DatasetRecordValues,
  EditorialAction,
  EditorialAuditEvent,
  EditorialRecordHead,
  EditorialRecordVersion,
  PublicationQueueItem,
  PublicationQueueStatus,
  ScheduledPublication,
  ScheduledPublicationStatus,
} from "../../index";

export interface EditorialHeadRow {
  dataset_id: string;
  record_id: string;
  current_version: number;
  current_version_id: string;
  status: DatasetPublicationStatus;
  updated_at: string;
  updated_by: string;
}

export interface EditorialVersionRow {
  id: string;
  dataset_id: string;
  record_id: string;
  version: number;
  status: DatasetPublicationStatus;
  values: DatasetRecordValues;
  source: EditorialRecordVersion["source"] | null;
  created_at: string;
  created_by: string;
  note: string | null;
}

export interface EditorialAuditRow {
  id: string;
  dataset_id: string;
  record_id: string;
  version_id: string;
  action: EditorialAction;
  actor_id: string;
  occurred_at: string;
  from_status: DatasetPublicationStatus | null;
  to_status: DatasetPublicationStatus;
  note: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PublicationQueueRow {
  id: string;
  dataset_id: string;
  record_id: string;
  version_id: string;
  expected_version: number;
  requested_by: string;
  requested_at: string;
  status: PublicationQueueStatus;
  attempts: number;
  last_attempt_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  failure_message: string | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ScheduledPublicationRow {
  id: string;
  dataset_id: string;
  record_id: string;
  version_id: string;
  expected_version: number;
  requested_by: string;
  requested_at: string;
  publication_note: string | null;
  publication_metadata: Record<string, unknown> | null;
  scheduled_for: string;
  created_at: string;
  created_by: string;
  status: ScheduledPublicationStatus;
  queued_at: string | null;
  queue_item_id: string | null;
  cancelled_at: string | null;
  failure_message: string | null;
  metadata: Record<string, unknown> | null;
}

export function mapHeadRow(
  row: EditorialHeadRow,
): EditorialRecordHead {
  return {
    datasetId: row.dataset_id,
    recordId: row.record_id,
    currentVersion: row.current_version,
    currentVersionId: row.current_version_id,
    status: row.status,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function mapVersionRow(
  row: EditorialVersionRow,
): EditorialRecordVersion {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    recordId: row.record_id,
    version: row.version,
    status: row.status,
    values: row.values,
    source: row.source ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by,
    note: row.note ?? undefined,
  };
}

export function toVersionRow(
  version: EditorialRecordVersion,
): EditorialVersionRow {
  return {
    id: version.id,
    dataset_id: version.datasetId,
    record_id: version.recordId,
    version: version.version,
    status: version.status,
    values: version.values,
    source: version.source ?? null,
    created_at: version.createdAt,
    created_by: version.createdBy,
    note: version.note ?? null,
  };
}

export function mapAuditRow(
  row: EditorialAuditRow,
): EditorialAuditEvent {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    recordId: row.record_id,
    versionId: row.version_id,
    action: row.action,
    actorId: row.actor_id,
    occurredAt: row.occurred_at,
    fromStatus: row.from_status ?? undefined,
    toStatus: row.to_status,
    note: row.note ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

export function toAuditRow(
  event: EditorialAuditEvent,
): EditorialAuditRow {
  return {
    id: event.id,
    dataset_id: event.datasetId,
    record_id: event.recordId,
    version_id: event.versionId,
    action: event.action,
    actor_id: event.actorId,
    occurred_at: event.occurredAt,
    from_status: event.fromStatus ?? null,
    to_status: event.toStatus,
    note: event.note ?? null,
    metadata: event.metadata ?? null,
  };
}

export function mapQueueRow(
  row: PublicationQueueRow,
): PublicationQueueItem {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    recordId: row.record_id,
    versionId: row.version_id,
    expectedVersion: row.expected_version,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    status: row.status,
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    failureMessage: row.failure_message ?? undefined,
    note: row.note ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

export function toQueueRow(
  item: PublicationQueueItem,
): PublicationQueueRow {
  return {
    id: item.id,
    dataset_id: item.datasetId,
    record_id: item.recordId,
    version_id: item.versionId,
    expected_version: item.expectedVersion,
    requested_by: item.requestedBy,
    requested_at: item.requestedAt,
    status: item.status,
    attempts: item.attempts,
    last_attempt_at: item.lastAttemptAt ?? null,
    completed_at: item.completedAt ?? null,
    cancelled_at: item.cancelledAt ?? null,
    failure_message: item.failureMessage ?? null,
    note: item.note ?? null,
    metadata: item.metadata ?? null,
  };
}

export function mapScheduleRow(
  row: ScheduledPublicationRow,
): ScheduledPublication {
  return {
    id: row.id,
    publication: {
      datasetId: row.dataset_id,
      recordId: row.record_id,
      versionId: row.version_id,
      expectedVersion: row.expected_version,
      requestedBy: row.requested_by,
      note: row.publication_note ?? undefined,
      metadata: row.publication_metadata ?? undefined,
    },
    scheduledFor: row.scheduled_for,
    createdAt: row.created_at,
    createdBy: row.created_by,
    status: row.status,
    queuedAt: row.queued_at ?? undefined,
    queueItemId: row.queue_item_id ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    failureMessage: row.failure_message ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

export function toScheduleRow(
  schedule: ScheduledPublication,
): ScheduledPublicationRow {
  return {
    id: schedule.id,
    dataset_id: schedule.publication.datasetId,
    record_id: schedule.publication.recordId,
    version_id: schedule.publication.versionId,
    expected_version: schedule.publication.expectedVersion,
    requested_by: schedule.publication.requestedBy,
    requested_at:
      schedule.publication.metadata?.requestedAt as string ??
      schedule.createdAt,
    publication_note: schedule.publication.note ?? null,
    publication_metadata:
      schedule.publication.metadata ?? null,
    scheduled_for: schedule.scheduledFor,
    created_at: schedule.createdAt,
    created_by: schedule.createdBy,
    status: schedule.status,
    queued_at: schedule.queuedAt ?? null,
    queue_item_id: schedule.queueItemId ?? null,
    cancelled_at: schedule.cancelledAt ?? null,
    failure_message: schedule.failureMessage ?? null,
    metadata: schedule.metadata ?? null,
  };
}
