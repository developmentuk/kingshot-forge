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

export interface EditorialRollbackInput
  extends EditorialTransitionInput {
  targetVersionId: string
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
  publish: {
    from: ['approved'],
    to: 'published',
    action: 'published',
  },
  archive: {
    from: ['published'],
    to: 'archived',
    action: 'archived',
  },
  restore: {
    from: ['archived'],
    to: 'published',
    action: 'restored',
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

export class EditorialRollbackError extends Error {
  readonly targetVersionId: string
  readonly reason:
    | 'not_found'
    | 'wrong_record'
    | 'not_older'

  constructor(
    targetVersionId: string,
    reason: EditorialRollbackError['reason'],
  ) {
    const messages = {
      not_found: `Editorial rollback target "${targetVersionId}" was not found.`,
      wrong_record:
        `Editorial rollback target "${targetVersionId}" belongs to a different record.`,
      not_older:
        `Editorial rollback target "${targetVersionId}" must be older than the current version.`,
    }

    super(messages[reason])
    this.name = 'EditorialRollbackError'
    this.targetVersionId = targetVersionId
    this.reason = reason
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

  publish(
    input: EditorialTransitionInput,
  ): Promise<EditorialTransitionResult> {
    return this.transition(
      input,
      transitions.publish,
    )
  }

  archive(
    input: EditorialTransitionInput,
  ): Promise<EditorialTransitionResult> {
    return this.transition(
      input,
      transitions.archive,
    )
  }

  restore(
    input: EditorialTransitionInput,
  ): Promise<EditorialTransitionResult> {
    return this.transition(
      input,
      transitions.restore,
    )
  }

  async rollback(
    input: EditorialRollbackInput,
  ): Promise<EditorialTransitionResult> {
    const context = await this.loadMutationContext(input)

    if (!['published', 'archived'].includes(context.head.status)) {
      throw new EditorialTransitionError(
        context.head.status,
        ['published', 'archived'],
        'published',
      )
    }

    const targetVersionId = requireText(
      input.targetVersionId,
      'Target version ID',
    )
    const targetVersion =
      await this.repository.getVersion(targetVersionId)

    if (!targetVersion) {
      throw new EditorialRollbackError(
        targetVersionId,
        'not_found',
      )
    }

    if (
      targetVersion.datasetId !== context.datasetId ||
      targetVersion.recordId !== context.recordId
    ) {
      throw new EditorialRollbackError(
        targetVersionId,
        'wrong_record',
      )
    }

    if (targetVersion.version >= context.head.currentVersion) {
      throw new EditorialRollbackError(
        targetVersionId,
        'not_older',
      )
    }

    return this.commitMutation({
      ...context,
      actorId: context.actorId,
      note: input.note,
      toStatus: 'published',
      action: 'rolled_back',
      sourceVersion: targetVersion,
      metadata: {
        rolledBackFromVersion:
          context.head.currentVersion,
        rolledBackToVersion: targetVersion.version,
        rolledBackToVersionId: targetVersion.id,
      },
    })
  }

  private async transition(
    input: EditorialTransitionInput,
    definition: TransitionDefinition,
  ): Promise<EditorialTransitionResult> {
    const context = await this.loadMutationContext(input)

    if (!definition.from.includes(context.head.status)) {
      throw new EditorialTransitionError(
        context.head.status,
        definition.from,
        definition.to,
      )
    }

    return this.commitMutation({
      ...context,
      actorId: context.actorId,
      note: input.note,
      toStatus: definition.to,
      action: definition.action,
      sourceVersion: context.currentVersion,
    })
  }

  private async loadMutationContext(
    input: EditorialTransitionInput,
  ): Promise<{
    datasetId: string
    recordId: string
    actorId: string
    expectedVersion: number
    head: EditorialRecordHead
    currentVersion: EditorialRecordVersion
  }> {
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

    if (head.currentVersion !== input.expectedVersion) {
      throw new EditorialConcurrencyError(
        datasetId,
        recordId,
        input.expectedVersion,
        head.currentVersion,
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

    return {
      datasetId,
      recordId,
      actorId,
      expectedVersion: input.expectedVersion,
      head,
      currentVersion,
    }
  }

  private async commitMutation(input: {
    datasetId: string
    recordId: string
    actorId: string
    expectedVersion: number
    head: EditorialRecordHead
    sourceVersion: EditorialRecordVersion
    toStatus: DatasetPublicationStatus
    action: EditorialAction
    note?: string
    metadata?: Record<string, unknown>
  }): Promise<EditorialTransitionResult> {
    const nextVersionNumber =
      input.head.currentVersion + 1
    const occurredAt = this.now()
    const versionId = this.createId()
    const auditEventId = this.createId()

    const version: EditorialRecordVersion = {
      ...structuredClone(input.sourceVersion),
      id: versionId,
      datasetId: input.datasetId,
      recordId: input.recordId,
      version: nextVersionNumber,
      status: input.toStatus,
      createdAt: occurredAt,
      createdBy: input.actorId,
      note: input.note,
    }

    const nextHead: EditorialRecordHead = {
      ...input.head,
      currentVersion: nextVersionNumber,
      currentVersionId: versionId,
      status: input.toStatus,
      updatedAt: occurredAt,
      updatedBy: input.actorId,
    }

    const auditEvent: EditorialAuditEvent = {
      id: auditEventId,
      datasetId: input.datasetId,
      recordId: input.recordId,
      versionId,
      action: input.action,
      actorId: input.actorId,
      occurredAt,
      fromStatus: input.head.status,
      toStatus: input.toStatus,
      note: input.note,
      metadata: input.metadata,
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
