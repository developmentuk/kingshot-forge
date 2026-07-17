import type {
  DatasetRecordValues,
} from '../../datasets/index.js'
import type {
  EditorialAuditEvent,
  EditorialDraftInput,
  EditorialDraftSaveResult,
  EditorialRecordHead,
  EditorialRecordVersion,
} from '../contracts.js'
import type {
  EditorialRepository,
} from '../repositories/EditorialRepository.js'

export interface EditorialDraftServiceOptions {
  now?: () => string
  createId?: () => string
}

export class EditorialDraftStatusError extends Error {
  readonly currentStatus: EditorialRecordHead['status']

  constructor(currentStatus: EditorialRecordHead['status']) {
    super(
      `Draft values can only be saved while the editorial record is in "draft" status; current status is "${currentStatus}".`,
    )
    this.name = 'EditorialDraftStatusError'
    this.currentStatus = currentStatus
  }
}

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

export class EditorialDraftService {
  private readonly repository: EditorialRepository
  private readonly now: () => string
  private readonly createId: () => string

  constructor(
    repository: EditorialRepository,
    options: EditorialDraftServiceOptions = {},
  ) {
    this.repository = repository
    this.now = options.now ?? defaultNow
    this.createId =
      options.createId ?? defaultCreateId
  }

  async saveDraft<
    TValues extends DatasetRecordValues,
  >(
    input: EditorialDraftInput<TValues>,
  ): Promise<EditorialDraftSaveResult<TValues>> {
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

    const existingHead =
      await this.repository.getHead(
        datasetId,
        recordId,
      )

    if (
      existingHead &&
      existingHead.status !== 'draft'
    ) {
      throw new EditorialDraftStatusError(
        existingHead.status,
      )
    }

    const nextVersion =
      (existingHead?.currentVersion ?? 0) + 1
    const occurredAt = this.now()
    const versionId = this.createId()
    const auditEventId = this.createId()

    const version:
      EditorialRecordVersion<TValues> = {
        id: versionId,
        datasetId,
        recordId,
        version: nextVersion,
        status: 'draft',
        values: structuredClone(input.values),
        source: input.source
          ? structuredClone(input.source)
          : undefined,
        createdAt: occurredAt,
        createdBy: actorId,
        note: input.note,
      }

    const head: EditorialRecordHead = {
      datasetId,
      recordId,
      currentVersion: nextVersion,
      currentVersionId: versionId,
      status: 'draft',
      updatedAt: occurredAt,
      updatedBy: actorId,
    }

    const auditEvent:
      EditorialAuditEvent = {
        id: auditEventId,
        datasetId,
        recordId,
        versionId,
        action: existingHead
          ? 'draft_saved'
          : 'draft_created',
        actorId,
        occurredAt,
        fromStatus: existingHead?.status,
        toStatus: 'draft',
        note: input.note,
      }

    await this.repository.commitVersion(
      head,
      version,
      auditEvent,
      input.expectedVersion,
    )

    return {
      head,
      version,
      auditEvent,
    }
  }

  async getCurrentDraft(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialRecordVersion | undefined> {
    const head = await this.repository.getHead(
      datasetId,
      recordId,
    )

    if (!head || head.status !== 'draft') {
      return undefined
    }

    return this.repository.getVersion(
      head.currentVersionId,
    )
  }

  listVersions(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialRecordVersion[]> {
    return this.repository.listVersions(
      datasetId,
      recordId,
    )
  }

  listAuditEvents(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialAuditEvent[]> {
    return this.repository.listAuditEvents(
      datasetId,
      recordId,
    )
  }
}
