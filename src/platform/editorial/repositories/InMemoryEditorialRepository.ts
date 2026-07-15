import type {
  EditorialAuditEvent,
  EditorialRecordHead,
  EditorialRecordVersion,
} from '../contracts'
import {
  EditorialConcurrencyError,
} from '../contracts'
import type {
  EditorialRepository,
} from './EditorialRepository'

function getRecordKey(
  datasetId: string,
  recordId: string,
): string {
  return `${datasetId}::${recordId}`
}

function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

export class InMemoryEditorialRepository
  implements EditorialRepository {
  private readonly heads =
    new Map<string, EditorialRecordHead>()

  private readonly versions =
    new Map<string, EditorialRecordVersion>()

  private readonly versionIdsByRecord =
    new Map<string, string[]>()

  private readonly auditEventsByRecord =
    new Map<string, EditorialAuditEvent[]>()

  async getHead(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialRecordHead | undefined> {
    const head = this.heads.get(
      getRecordKey(datasetId, recordId),
    )

    return head ? cloneValue(head) : undefined
  }

  async getVersion(
    versionId: string,
  ): Promise<EditorialRecordVersion | undefined> {
    const version = this.versions.get(versionId)

    return version ? cloneValue(version) : undefined
  }

  async listVersions(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialRecordVersion[]> {
    const key = getRecordKey(datasetId, recordId)
    const versionIds =
      this.versionIdsByRecord.get(key) ?? []

    return versionIds
      .map((versionId) => this.versions.get(versionId))
      .filter(
        (
          version,
        ): version is EditorialRecordVersion =>
          version !== undefined,
      )
      .map(cloneValue)
      .sort(
        (first, second) =>
          second.version - first.version,
      )
  }

  async listAuditEvents(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialAuditEvent[]> {
    const events =
      this.auditEventsByRecord.get(
        getRecordKey(datasetId, recordId),
      ) ?? []

    return events
      .map(cloneValue)
      .sort((first, second) =>
        second.occurredAt.localeCompare(
          first.occurredAt,
        ),
      )
  }

  async commitVersion(
    head: EditorialRecordHead,
    version: EditorialRecordVersion,
    auditEvent: EditorialAuditEvent,
    expectedVersion: number | null,
  ): Promise<void> {
    const key = getRecordKey(
      head.datasetId,
      head.recordId,
    )
    const existingHead = this.heads.get(key)
    const actualVersion =
      existingHead?.currentVersion ?? null

    if (actualVersion !== expectedVersion) {
      throw new EditorialConcurrencyError(
        head.datasetId,
        head.recordId,
        expectedVersion,
        actualVersion,
      )
    }

    if (this.versions.has(version.id)) {
      throw new Error(
        `Editorial version "${version.id}" already exists.`,
      )
    }

    this.versions.set(
      version.id,
      cloneValue(version),
    )
    this.heads.set(key, cloneValue(head))

    const versionIds =
      this.versionIdsByRecord.get(key) ?? []
    this.versionIdsByRecord.set(
      key,
      [...versionIds, version.id],
    )

    const events =
      this.auditEventsByRecord.get(key) ?? []
    this.auditEventsByRecord.set(
      key,
      [...events, cloneValue(auditEvent)],
    )
  }
}
