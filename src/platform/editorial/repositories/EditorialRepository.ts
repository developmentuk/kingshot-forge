import type {
  EditorialAuditEvent,
  EditorialRecordHead,
  EditorialRecordVersion,
} from '../contracts'

export interface EditorialRepository {
  getHead(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialRecordHead | undefined>

  getVersion(
    versionId: string,
  ): Promise<EditorialRecordVersion | undefined>

  listVersions(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialRecordVersion[]>

  listAuditEvents(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialAuditEvent[]>

  commitVersion(
    head: EditorialRecordHead,
    version: EditorialRecordVersion,
    auditEvent: EditorialAuditEvent,
    expectedVersion: number | null,
  ): Promise<void>
}
