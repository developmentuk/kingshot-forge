import type {
  DatasetPublicationStatus,
  DatasetValue,
} from '../../datasets/index.js'
import type {
  EditorialAction,
  EditorialAuditEvent,
  EditorialRecordHead,
  EditorialRecordVersion,
} from '../contracts.js'

export type EditorialDiffKind =
  | 'added'
  | 'removed'
  | 'changed'

export interface EditorialFieldDiff {
  path: string
  kind: EditorialDiffKind
  before?: DatasetValue
  after?: DatasetValue
}

export interface EditorialVersionComparison {
  datasetId: string
  recordId: string
  fromVersion: EditorialRecordVersion
  toVersion: EditorialRecordVersion
  changes: EditorialFieldDiff[]
  changedFieldCount: number
  hasChanges: boolean
}

export interface EditorialHistoryFilter {
  actorId?: string
  status?: DatasetPublicationStatus
  action?: EditorialAction
  fromDate?: string
  toDate?: string
}

export interface EditorialHistoryEntry {
  version: EditorialRecordVersion
  auditEvent?: EditorialAuditEvent
}

export interface EditorialHistoryResult {
  head: EditorialRecordHead
  entries: EditorialHistoryEntry[]
  totalVersions: number
}

export interface EditorialRollbackPreview {
  head: EditorialRecordHead
  currentVersion: EditorialRecordVersion
  targetVersion: EditorialRecordVersion
  comparison: EditorialVersionComparison
}
