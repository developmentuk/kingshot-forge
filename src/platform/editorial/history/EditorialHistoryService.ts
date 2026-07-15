import type {
  DatasetPublicationStatus,
} from '../../datasets'
import type {
  EditorialAction,
  EditorialAuditEvent,
  EditorialRecordHead,
  EditorialRecordVersion,
} from '../contracts'
import type {
  EditorialRepository,
} from '../repositories'
import type {
  EditorialHistoryEntry,
  EditorialHistoryFilter,
  EditorialHistoryResult,
  EditorialRollbackPreview,
  EditorialVersionComparison,
} from './contracts'
import {
  EditorialDiffService,
} from './EditorialDiffService'

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

function parseOptionalDate(
  value: string | undefined,
  label: string,
): number | undefined {
  if (!value) {
    return undefined
  }

  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    throw new Error(`${label} must be a valid date.`)
  }

  return timestamp
}

function eventMatchesFilter(
  version: EditorialRecordVersion,
  event: EditorialAuditEvent | undefined,
  filter: EditorialHistoryFilter,
): boolean {
  const fromDate = parseOptionalDate(
    filter.fromDate,
    'From date',
  )
  const toDate = parseOptionalDate(
    filter.toDate,
    'To date',
  )
  const createdAt = Date.parse(version.createdAt)

  if (
    filter.actorId &&
    version.createdBy !== filter.actorId &&
    event?.actorId !== filter.actorId
  ) {
    return false
  }

  if (
    filter.status &&
    version.status !== filter.status
  ) {
    return false
  }

  if (
    filter.action &&
    event?.action !== filter.action
  ) {
    return false
  }

  if (
    fromDate !== undefined &&
    createdAt < fromDate
  ) {
    return false
  }

  if (
    toDate !== undefined &&
    createdAt > toDate
  ) {
    return false
  }

  return true
}

export class EditorialHistoryService {
  private readonly repository: EditorialRepository
  private readonly diffService: EditorialDiffService

  constructor(
    repository: EditorialRepository,
    diffService = new EditorialDiffService(),
  ) {
    this.repository = repository
    this.diffService = diffService
  }

  async getHistory(
    datasetIdInput: string,
    recordIdInput: string,
    filter: EditorialHistoryFilter = {},
  ): Promise<EditorialHistoryResult> {
    const datasetId = requireText(
      datasetIdInput,
      'Dataset ID',
    )
    const recordId = requireText(
      recordIdInput,
      'Record ID',
    )

    const [head, versions, auditEvents] =
      await Promise.all([
        this.repository.getHead(datasetId, recordId),
        this.repository.listVersions(datasetId, recordId),
        this.repository.listAuditEvents(datasetId, recordId),
      ])

    if (!head) {
      throw new Error(
        `Editorial record "${datasetId}/${recordId}" was not found.`,
      )
    }

    const auditByVersionId = new Map(
      auditEvents.map((event) => [
        event.versionId,
        event,
      ]),
    )

    const entries: EditorialHistoryEntry[] = versions
      .slice()
      .sort((left, right) =>
        right.version - left.version,
      )
      .map((version) => ({
        version,
        auditEvent: auditByVersionId.get(version.id),
      }))
      .filter(({ version, auditEvent }) =>
        eventMatchesFilter(
          version,
          auditEvent,
          filter,
        ),
      )
      .map((entry) => structuredClone(entry))

    return {
      head: structuredClone(head),
      entries,
      totalVersions: versions.length,
    }
  }

  async getVersion(
    versionIdInput: string,
  ): Promise<EditorialRecordVersion> {
    const versionId = requireText(
      versionIdInput,
      'Version ID',
    )
    const version =
      await this.repository.getVersion(versionId)

    if (!version) {
      throw new Error(
        `Editorial version "${versionId}" was not found.`,
      )
    }

    return structuredClone(version)
  }

  async compareVersions(
    fromVersionId: string,
    toVersionId: string,
  ): Promise<EditorialVersionComparison> {
    const [fromVersion, toVersion] =
      await Promise.all([
        this.getVersion(fromVersionId),
        this.getVersion(toVersionId),
      ])

    return this.diffService.compareVersions(
      fromVersion,
      toVersion,
    )
  }

  async previewRollback(
    datasetIdInput: string,
    recordIdInput: string,
    targetVersionIdInput: string,
  ): Promise<EditorialRollbackPreview> {
    const datasetId = requireText(
      datasetIdInput,
      'Dataset ID',
    )
    const recordId = requireText(
      recordIdInput,
      'Record ID',
    )
    const targetVersionId = requireText(
      targetVersionIdInput,
      'Target version ID',
    )

    const head = await this.requireHead(
      datasetId,
      recordId,
    )
    const [currentVersion, targetVersion] =
      await Promise.all([
        this.getVersion(head.currentVersionId),
        this.getVersion(targetVersionId),
      ])

    if (
      targetVersion.datasetId !== datasetId ||
      targetVersion.recordId !== recordId
    ) {
      throw new Error(
        'Rollback target must belong to the current editorial record.',
      )
    }

    if (targetVersion.version >= currentVersion.version) {
      throw new Error(
        'Rollback target must be older than the current version.',
      )
    }

    return {
      head: structuredClone(head),
      currentVersion,
      targetVersion,
      comparison: this.diffService.compareVersions(
        currentVersion,
        targetVersion,
      ),
    }
  }

  private async requireHead(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialRecordHead> {
    const head = await this.repository.getHead(
      datasetId,
      recordId,
    )

    if (!head) {
      throw new Error(
        `Editorial record "${datasetId}/${recordId}" was not found.`,
      )
    }

    return head
  }
}

export type {
  DatasetPublicationStatus,
  EditorialAction,
}
