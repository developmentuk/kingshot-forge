import type {
  DatasetPublicationStatus,
  DatasetRecordValues,
} from '../../datasets'
import type {
  EditorialAction,
  EditorialAuditEvent,
  EditorialRecordHead,
  EditorialRecordVersion,
} from '../contracts'
import {
  EditorialConcurrencyError,
} from '../contracts'
import type {
  EditorialRepository,
} from '../repositories/EditorialRepository'

export interface EditorialTransitionInput {
  datasetId: string
  recordId: string
  actorId: string
  expectedVersion: number
  note?: string
}

export interface EditorialTransitionResult<
  TValues extends DatasetRecordValues = DatasetRecordValues,
> {
  head: EditorialRecordHead
  version: EditorialRecordVersion<TValues>
  auditEvent: EditorialAuditEvent
}

export interface EditorialWorkflowServiceOptions {
  now?: () => string
  createId?: () => string
}

interface TransitionDefinition {
  from: DatasetPublicationStatus[]
  to: DatasetPublicationStatus
  action: EditorialAction
}

const transitions = {
  submitForReview: {
    from: ['draft'],
    to: 'in_review',
    action: 'submitted_for_review',
  },
  returnToDraft: {
    from: ['in_review'],
    to: 'draft',
    action: 'returned_to_draft',
  },
  approve: {
    from: ['in_review'],
    to: 'approved',
    action: 'approved',
  },
  reject: {
    from: ['in_review'],
    to: 'draft',
    action: 'rejected',
  },
} satisfies Record<string, TransitionDefinition>

function defaultNow(): string {
  return new Date().toISOString()
}

function defaultCreateId(): string {
  return crypto.randomUUID()
}

function requireText(
  value: string,
  label: string,
): string {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`)
  }

  return trimmed
}

export class EditorialTransitionError extends Error {
  readonly currentStatus: DatasetPublicationStatus
  readonly allowedStatuses: DatasetPublicationStatus[]
  readonly targetStatus: DatasetPublicationStatus

  constructor(
    currentStatus: DatasetPublicationStatus,
    allowedStatuses: DatasetPublicationStatus[],
    targetStatus: DatasetPublicationStatus,
  ) {
    super(
      `Cannot transition editorial record from "${currentStatus}" ` +
        `to "${targetStatus}".`,
    )
    this.name = 'EditorialTransitionError'
    this.currentStatus = currentStatus
    this.allowedStatuses = allowedStatuses
    this.targetStatus = targetStatus
  }
}

export class EditorialWorkflowService {
  private readonly repository: EditorialRepository
  private readonly now: () => string
  private readonly createId: () => string

  constructor(
    repository: EditorialRepository,
    options: EditorialWorkflowServiceOptions = {},
  ) {
    this.repository = repository
    this.now = options.now ?? defaultNow
    this.createId =
      options.createId ?? defaultCreateId
  }

  submitForReview(
    input: EditorialTransitionInput,
  ): Promise<EditorialTransitionResult> {
    return this.transition(
      input,
      transitions.submitForReview,
    )
  }

  returnToDraft(
    input: EditorialTransitionInput,
  ): Promise<EditorialTransitionResult> {
    return this.transition(
      input,
      transitions.returnToDraft,
    )
  }

  approve(
    input: EditorialTransitionInput,
  ): Promise<EditorialTransitionResult> {
    return this.transition(
      input,
      transitions.approve,
    )
  }

  reject(
    input: EditorialTransitionInput,
  ): Promise<EditorialTransitionResult> {
    return this.transition(
      input,
      transitions.reject,
    )
  }

  private async transition(
    input: EditorialTransitionInput,
    definition: TransitionDefinition,
  ): Promise<EditorialTransitionResult> {
    const datasetId = requireText(
      input.datasetId,
      'Dataset ID',
    )
    const recordId = requireText(
      input.recordId,
      'Record ID',
    )
    const actorId = requireText(
      input.actorId,
      'Actor ID',
    )

    const head = await this.repository.getHead(
      datasetId,
      recordId,
    )

    if (!head) {
      throw new Error(
        `Editorial record "${datasetId}/${recordId}" was not found.`,
      )
    }

    if (
      head.currentVersion !==
      input.expectedVersion
    ) {
      throw new EditorialConcurrencyError(
        datasetId,
        recordId,
        input.expectedVersion,
        head.currentVersion,
      )
    }

    if (!definition.from.includes(head.status)) {
      throw new EditorialTransitionError(
        head.status,
        definition.from,
        definition.to,
      )
    }

    const currentVersion =
      await this.repository.getVersion(
        head.currentVersionId,
      )

    if (!currentVersion) {
      throw new Error(
        `Editorial version "${head.currentVersionId}" was not found.`,
      )
    }

    const nextVersionNumber =
      head.currentVersion + 1
    const occurredAt = this.now()
    const versionId = this.createId()
    const auditEventId = this.createId()

    const version: EditorialRecordVersion = {
      ...structuredClone(currentVersion),
      id: versionId,
      version: nextVersionNumber,
      status: definition.to,
      createdAt: occurredAt,
      createdBy: actorId,
      note: input.note,
    }

    const nextHead: EditorialRecordHead = {
      ...head,
      currentVersion: nextVersionNumber,
      currentVersionId: versionId,
      status: definition.to,
      updatedAt: occurredAt,
      updatedBy: actorId,
    }

    const auditEvent: EditorialAuditEvent = {
      id: auditEventId,
      datasetId,
      recordId,
      versionId,
      action: definition.action,
      actorId,
      occurredAt,
      fromStatus: head.status,
      toStatus: definition.to,
      note: input.note,
    }

    await this.repository.commitVersion(
      nextHead,
      version,
      auditEvent,
      input.expectedVersion,
    )

    return {
      head: nextHead,
      version,
      auditEvent,
    }
  }
}
